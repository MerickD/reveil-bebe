import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createServiceClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import {
  normalizeEmail,
  normalizeFirstName,
} from "@/lib/notification-utils";

export interface NotificationSubscriber {
  id: string;
  email: string;
  firstName: string | null;
  createdAt: string;
  active: boolean;
}

interface StoredSubscriber {
  id: string;
  email: string;
  first_name: string | null;
  session_id: string | null;
  unsubscribe_token: string;
  active: boolean;
  created_at: string;
}

const LOCAL_FILE = join(
  process.cwd(),
  ".data",
  "notification-subscribers-local.json"
);

function readLocal(): StoredSubscriber[] {
  if (process.env.NODE_ENV === "production") return [];
  if (!existsSync(LOCAL_FILE)) return [];
  try {
    const data = JSON.parse(readFileSync(LOCAL_FILE, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeLocal(rows: StoredSubscriber[]): void {
  if (process.env.NODE_ENV === "production") return;
  const dir = join(process.cwd(), ".data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCAL_FILE, JSON.stringify(rows, null, 2), "utf-8");
}

function toPublic(row: StoredSubscriber): NotificationSubscriber {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    createdAt: row.created_at,
    active: row.active,
  };
}

function isMissingTableError(message: string): boolean {
  return (
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("Could not find")
  );
}

export async function subscribeToNotifications(input: {
  email: string;
  firstName?: string;
  sessionId?: string;
}): Promise<{ ok: boolean; error?: string; alreadySubscribed?: boolean }> {
  const email = normalizeEmail(input.email);
  if (!email) {
    return { ok: false, error: "Adresse email invalide" };
  }

  const firstName = normalizeFirstName(input.firstName ?? "") ?? null;
  const unsubscribeToken = crypto.randomUUID();
  const row: StoredSubscriber = {
    id: crypto.randomUUID(),
    email,
    first_name: firstName,
    session_id: input.sessionId ?? null,
    unsubscribe_token: unsubscribeToken,
    active: true,
    created_at: new Date().toISOString(),
  };

  const supabase = createServerClient();
  const { error } = await supabase.from("notification_subscribers").insert({
    email: row.email,
    first_name: row.first_name,
    session_id: row.session_id,
    unsubscribe_token: row.unsubscribe_token,
    active: true,
  });

  if (!error) return { ok: true };

  if (error.code === "23505") {
    const service = createServiceClient();
    if (service) {
      const { data: existing } = await service
        .from("notification_subscribers")
        .select("id, active")
        .ilike("email", email)
        .maybeSingle();

      if (existing && !existing.active) {
        const { error: reactivateError } = await service
          .from("notification_subscribers")
          .update({
            active: true,
            first_name: firstName,
            session_id: input.sessionId ?? null,
          })
          .eq("id", existing.id);

        if (!reactivateError) return { ok: true };
      }
    }

    return {
      ok: true,
      alreadySubscribed: true,
    };
  }

  if (isMissingTableError(error.message)) {
    const local = readLocal();
    const existing = local.find((s) => s.email === email);
    if (existing) {
      existing.active = true;
      existing.first_name = firstName ?? existing.first_name;
      writeLocal(local);
      return { ok: true, alreadySubscribed: true };
    }
    local.unshift(row);
    writeLocal(local);
    return { ok: true };
  }

  const service = createServiceClient();
  if (service) {
    const { error: serviceError } = await service
      .from("notification_subscribers")
      .insert({
        email: row.email,
        first_name: row.first_name,
        session_id: row.session_id,
        unsubscribe_token: row.unsubscribe_token,
        active: true,
      });

    if (!serviceError) return { ok: true };
    if (serviceError.code === "23505") {
      return { ok: true, alreadySubscribed: true };
    }
  }

  return { ok: false, error: error.message };
}

export async function listActiveSubscribers(): Promise<
  (NotificationSubscriber & { unsubscribeToken: string })[]
> {
  const service = createServiceClient();

  if (service) {
    const { data, error } = await service
      .from("notification_subscribers")
      .select("id, email, first_name, created_at, active, unsubscribe_token")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        createdAt: row.created_at,
        active: row.active,
        unsubscribeToken: row.unsubscribe_token,
      }));
    }
  }

  return readLocal()
    .filter((s) => s.active)
    .map((s) => ({
      ...toPublic(s),
      unsubscribeToken: s.unsubscribe_token,
    }));
}

export async function listSubscribersForAdmin(): Promise<NotificationSubscriber[]> {
  const service = createServiceClient();

  if (service) {
    const { data, error } = await service
      .from("notification_subscribers")
      .select("id, email, first_name, created_at, active")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        createdAt: row.created_at,
        active: row.active,
      }));
    }
  }

  return readLocal().filter((s) => s.active).map(toPublic);
}

export async function unsubscribeByToken(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  if (!token || token.length < 10) {
    return { ok: false, error: "Lien invalide" };
  }

  const service = createServiceClient();
  if (service) {
    const { data, error } = await service
      .from("notification_subscribers")
      .update({ active: false })
      .eq("unsubscribe_token", token)
      .select("id")
      .maybeSingle();

    if (!error && data) return { ok: true };
    if (error && !isMissingTableError(error.message)) {
      return { ok: false, error: error.message };
    }
  }

  const local = readLocal();
  const found = local.find((s) => s.unsubscribe_token === token);
  if (!found) return { ok: false, error: "Abonnement introuvable" };
  found.active = false;
  writeLocal(local);
  return { ok: true };
}

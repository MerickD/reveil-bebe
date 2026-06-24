import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createServiceClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import {
  normalizeSuggestedName,
} from "@/lib/name-suggestion-utils";
import { normalizeVoterName } from "@/lib/vote";

export interface NameSuggestion {
  id: string;
  suggestedName: string;
  proposerName: string;
  createdAt: string;
}

interface StoredSuggestion {
  id: string;
  suggested_name: string;
  proposer_name: string;
  session_id: string | null;
  created_at: string;
}

const LOCAL_FILE = join(process.cwd(), ".data", "name-suggestions-local.json");

function readLocalSuggestions(): StoredSuggestion[] {
  if (process.env.NODE_ENV === "production") return [];
  if (!existsSync(LOCAL_FILE)) return [];

  try {
    const data = JSON.parse(readFileSync(LOCAL_FILE, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeLocalSuggestions(rows: StoredSuggestion[]): void {
  if (process.env.NODE_ENV === "production") return;

  const dir = join(process.cwd(), ".data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCAL_FILE, JSON.stringify(rows, null, 2), "utf-8");
}

function toSuggestion(row: StoredSuggestion): NameSuggestion {
  return {
    id: row.id,
    suggestedName: row.suggested_name,
    proposerName: row.proposer_name,
    createdAt: row.created_at,
  };
}

export async function saveNameSuggestion(input: {
  suggestedName: string;
  proposerName: string;
  sessionId?: string;
}): Promise<{ ok: boolean; error?: string; usedLocalFallback?: boolean }> {
  const suggestedName = normalizeSuggestedName(input.suggestedName);
  const proposerName = normalizeVoterName(input.proposerName);

  if (!suggestedName || !proposerName) {
    return { ok: false, error: "Données invalides" };
  }

  const row: StoredSuggestion = {
    id: crypto.randomUUID(),
    suggested_name: suggestedName,
    proposer_name: proposerName,
    session_id: input.sessionId ?? null,
    created_at: new Date().toISOString(),
  };

  const supabase = createServerClient();
  const { error } = await supabase.from("baby_name_suggestions").insert({
    suggested_name: row.suggested_name,
    proposer_name: row.proposer_name,
    session_id: row.session_id,
  });

  if (!error) return { ok: true };

  const service = createServiceClient();
  if (service) {
    const { error: serviceError } = await service
      .from("baby_name_suggestions")
      .insert({
        suggested_name: row.suggested_name,
        proposer_name: row.proposer_name,
        session_id: row.session_id,
      });

    if (!serviceError) return { ok: true };
  }

  if (
    error.message.includes("does not exist") ||
    error.message.includes("schema cache") ||
    error.message.includes("Could not find")
  ) {
    const local = readLocalSuggestions();
    local.unshift(row);
    writeLocalSuggestions(local);
    return {
      ok: true,
      usedLocalFallback: true,
      error:
        "Table Supabase manquante — sauvegarde locale. Exécutez supabase/migration-name-suggestions.sql",
    };
  }

  return { ok: false, error: error.message };
}

export async function listNameSuggestions(limit = 100): Promise<NameSuggestion[]> {
  const service = createServiceClient();

  if (service) {
    const { data, error } = await service
      .from("baby_name_suggestions")
      .select("id, suggested_name, proposer_name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data) {
      return data.map((row) =>
        toSuggestion({
          id: row.id,
          suggested_name: row.suggested_name,
          proposer_name: row.proposer_name,
          session_id: null,
          created_at: row.created_at,
        })
      );
    }
  }

  return readLocalSuggestions()
    .slice(0, limit)
    .map(toSuggestion);
}

import { createServiceClient } from "@/lib/supabase/admin";
import type { VoteChoice } from "@/types/votes";

export interface RevealConfig {
  revealDate: string;
  result: VoteChoice | null;
  nameGameEnabled: boolean;
  nameSuggestionsEnabled: boolean;
  source: "supabase" | "env";
}

export interface RevealFeatureToggles {
  nameGameEnabled?: boolean;
  nameSuggestionsEnabled?: boolean;
}

function isMissingColumnError(message: string): boolean {
  return (
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("Could not find")
  );
}

export interface RevealState extends RevealConfig {
  isRevealed: boolean;
}

async function getFromSupabase(): Promise<RevealConfig | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const columnSets = [
    "reveal_at, result, name_game_enabled, name_suggestions_enabled",
    "reveal_at, result, name_game_enabled",
    "reveal_at, result",
  ];

  for (const columns of columnSets) {
    const { data, error } = await supabase
      .from("reveal_settings")
      .select(columns)
      .eq("id", 1)
      .single();

    if (!error && data) {
      const row = data as unknown as {
        reveal_at: string;
        result: VoteChoice | null;
        name_game_enabled?: boolean;
        name_suggestions_enabled?: boolean;
      };

      return {
        revealDate: row.reveal_at,
        result: row.result,
        nameGameEnabled: Boolean(row.name_game_enabled),
        nameSuggestionsEnabled: Boolean(row.name_suggestions_enabled),
        source: "supabase",
      };
    }
  }

  return null;
}

function getFromEnv(): RevealConfig | null {
  const revealDate = process.env.NEXT_PUBLIC_REVEAL_DATE;
  if (!revealDate) return null;

  const raw = process.env.REVEAL_RESULT;
  const result =
    raw === "fille" || raw === "garcon" ? (raw as VoteChoice) : null;

  const nameGameEnabled = process.env.NAME_GAME_ENABLED === "true";
  const nameSuggestionsEnabled =
    process.env.NAME_SUGGESTIONS_ENABLED === "true";

  return {
    revealDate,
    result,
    nameGameEnabled,
    nameSuggestionsEnabled,
    source: "env",
  };
}

export async function getRevealConfig(): Promise<RevealConfig | null> {
  return (await getFromSupabase()) ?? getFromEnv();
}

export async function getRevealState(): Promise<RevealState | null> {
  const config = await getRevealConfig();
  if (!config) return null;

  const isRevealed = Date.now() >= new Date(config.revealDate).getTime();

  return {
    ...config,
    isRevealed,
  };
}

export async function updateRevealConfig(
  revealDate: string,
  result: VoteChoice | null,
  toggles?: RevealFeatureToggles
): Promise<{ ok: boolean; error?: string; warning?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY non configurée" };
  }

  const row: Record<string, unknown> = {
    id: 1,
    reveal_at: revealDate,
    result,
    updated_at: new Date().toISOString(),
  };

  if (toggles?.nameGameEnabled !== undefined) {
    row.name_game_enabled = toggles.nameGameEnabled;
  }
  if (toggles?.nameSuggestionsEnabled !== undefined) {
    row.name_suggestions_enabled = toggles.nameSuggestionsEnabled;
  }

  let { error } = await supabase
    .from("reveal_settings")
    .upsert(row, { onConflict: "id" });

  const warnings: string[] = [];

  if (error && toggles?.nameSuggestionsEnabled !== undefined) {
    delete row.name_suggestions_enabled;
    ({ error } = await supabase
      .from("reveal_settings")
      .upsert(row, { onConflict: "id" }));
    if (!error) {
      warnings.push(
        "Colonne name_suggestions_enabled absente — exécutez supabase/migration-name-suggestions.sql"
      );
    }
  }

  if (error && toggles?.nameGameEnabled !== undefined) {
    delete row.name_game_enabled;
    ({ error } = await supabase
      .from("reveal_settings")
      .upsert(row, { onConflict: "id" }));
  }

  if (error && isMissingColumnError(error.message)) {
    delete row.name_game_enabled;
    delete row.name_suggestions_enabled;
    ({ error } = await supabase
      .from("reveal_settings")
      .upsert(row, { onConflict: "id" }));
  }

  if (error) return { ok: false, error: error.message };
  return { ok: true, warning: warnings[0] };
}

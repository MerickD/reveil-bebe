import { createServiceClient } from "@/lib/supabase/admin";
import type { VoteChoice } from "@/types/votes";

export interface RevealConfig {
  revealDate: string;
  result: VoteChoice | null;
  source: "supabase" | "env";
}

export interface RevealState extends RevealConfig {
  isRevealed: boolean;
}

async function getFromSupabase(): Promise<RevealConfig | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("reveal_settings")
    .select("reveal_at, result")
    .eq("id", 1)
    .single();

  if (error || !data) return null;

  return {
    revealDate: data.reveal_at,
    result: data.result as VoteChoice | null,
    source: "supabase",
  };
}

function getFromEnv(): RevealConfig | null {
  const revealDate = process.env.NEXT_PUBLIC_REVEAL_DATE;
  if (!revealDate) return null;

  const raw = process.env.REVEAL_RESULT;
  const result =
    raw === "fille" || raw === "garcon" ? (raw as VoteChoice) : null;

  return { revealDate, result, source: "env" };
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
  result: VoteChoice | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY non configurée" };
  }

  const { error } = await supabase.from("reveal_settings").upsert(
    {
      id: 1,
      reveal_at: revealDate,
      result,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

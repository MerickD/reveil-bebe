import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  parseRevealedIndices,
  sanitizeRevealedIndices,
} from "@/lib/mystery-name-utils";
import type { VoteChoice } from "@/types/votes";

export interface NameGameStoredState {
  revealedLetters: {
    fille: number[];
    garcon: number[];
  };
  winnerOnly: boolean;
}

const DEFAULT_STATE: NameGameStoredState = {
  revealedLetters: { fille: [], garcon: [] },
  winnerOnly: false,
};

const LOCAL_FILE = join(process.cwd(), ".data", "name-game-local.json");

function isMissingColumnError(message: string): boolean {
  return (
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("Could not find")
  );
}

function parseStoredState(raw: unknown): NameGameStoredState {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_STATE };

  const data = raw as Record<string, unknown>;
  const revealed = data.revealedLetters;

  let fille: number[] = [];
  let garcon: number[] = [];

  if (revealed && typeof revealed === "object") {
    const letters = revealed as Record<string, unknown>;
    fille = parseRevealedIndices(letters.fille);
    garcon = parseRevealedIndices(letters.garcon);
  } else {
    fille = parseRevealedIndices(data.revealed_letters_fille);
    garcon = parseRevealedIndices(data.revealed_letters_garcon);
  }

  return {
    revealedLetters: { fille, garcon },
    winnerOnly: data.winnerOnly === true || data.name_game_winner_only === true,
  };
}

function readLocalState(): NameGameStoredState | null {
  if (process.env.NODE_ENV === "production") return null;
  if (!existsSync(LOCAL_FILE)) return null;

  try {
    return parseStoredState(JSON.parse(readFileSync(LOCAL_FILE, "utf-8")));
  } catch {
    return null;
  }
}

function writeLocalState(state: NameGameStoredState): void {
  if (process.env.NODE_ENV === "production") return;

  const dir = join(process.cwd(), ".data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCAL_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export async function getNameGameStoredState(): Promise<NameGameStoredState> {
  const supabase = createServiceClient();

  if (supabase) {
    const jsonColumn = await supabase
      .from("reveal_settings")
      .select("name_game_state")
      .eq("id", 1)
      .single();

    if (!jsonColumn.error && jsonColumn.data?.name_game_state) {
      return parseStoredState(jsonColumn.data.name_game_state);
    }

    const splitColumns = await supabase
      .from("reveal_settings")
      .select(
        "revealed_letters_fille, revealed_letters_garcon, name_game_winner_only"
      )
      .eq("id", 1)
      .single();

    if (!splitColumns.error && splitColumns.data) {
      return parseStoredState(splitColumns.data);
    }
  }

  return readLocalState() ?? { ...DEFAULT_STATE };
}

export async function saveNameGameStoredState(
  state: NameGameStoredState,
  names: { fille: string; garcon: string }
): Promise<{ ok: boolean; error?: string; usedLocalFallback?: boolean }> {
  const sanitized: NameGameStoredState = {
    revealedLetters: {
      fille: sanitizeRevealedIndices(names.fille, state.revealedLetters.fille),
      garcon: sanitizeRevealedIndices(
        names.garcon,
        state.revealedLetters.garcon
      ),
    },
    winnerOnly: state.winnerOnly,
  };

  const supabase = createServiceClient();
  if (!supabase) {
    writeLocalState(sanitized);
    return { ok: true, usedLocalFallback: true };
  }

  const payload = {
    name_game_state: sanitized,
    revealed_letters_fille: sanitized.revealedLetters.fille,
    revealed_letters_garcon: sanitized.revealedLetters.garcon,
    name_game_winner_only: sanitized.winnerOnly,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase
    .from("reveal_settings")
    .update(payload)
    .eq("id", 1);

  if (error && isMissingColumnError(error.message)) {
    ({ error } = await supabase
      .from("reveal_settings")
      .update({
        name_game_state: sanitized,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1));
  }

  if (error && isMissingColumnError(error.message)) {
    ({ error } = await supabase.from("reveal_settings").upsert(
      { id: 1, name_game_state: sanitized, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    ));
  }

  if (error && isMissingColumnError(error.message)) {
    writeLocalState(sanitized);
    return {
      ok: true,
      usedLocalFallback: true,
      error:
        "Colonnes Supabase manquantes — sauvegarde locale. Exécutez supabase/migration-revealed-letters-quick.sql",
    };
  }

  if (error) return { ok: false, error: error.message };

  if (process.env.NODE_ENV !== "production") {
    writeLocalState(sanitized);
  }

  return { ok: true };
}

export function shouldShowSingleName(
  stored: NameGameStoredState,
  result: VoteChoice | null
): result is VoteChoice {
  return stored.winnerOnly && result !== null;
}

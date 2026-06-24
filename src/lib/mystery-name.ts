import "server-only";

import { getRevealConfig } from "@/lib/reveal";
import {
  getNameGameStoredState,
  saveNameGameStoredState,
  shouldShowSingleName,
} from "@/lib/name-game-store";
import {
  computeMaskedNameFromIndices,
  normalizeBabyName,
  normalizeGuess,
} from "@/lib/mystery-name-utils";
import type {
  MysteryNameConfig,
  MysteryNameGameState,
} from "@/lib/mystery-name-types";
import type { VoteChoice } from "@/types/votes";

export type {
  MaskedNameResult,
  MaskedNameVariant,
  MysteryNameConfig,
  MysteryNameGameState,
  NameSlot,
} from "@/lib/mystery-name-types";

export {
  computeMaskedNameFromIndices,
  getLetterIndices,
  normalizeBabyName,
  normalizeGuess,
  parseRevealedIndices,
  sanitizeRevealedIndices,
} from "@/lib/mystery-name-utils";

const VARIANT_META: Record<VoteChoice, { label: string; emoji: string }> = {
  fille: { label: "Si c'est une fille", emoji: "🌸" },
  garcon: { label: "Si c'est un garçon", emoji: "🌿" },
};

const SINGLE_VARIANT_META: Record<VoteChoice, { label: string; emoji: string }> =
  {
    fille: { label: "Son prénom", emoji: "🌸" },
    garcon: { label: "Son prénom", emoji: "🌿" },
  };

function buildVariants(config: MysteryNameConfig): MysteryNameGameState {
  const filleMasked = computeMaskedNameFromIndices(
    config.names.fille,
    config.revealedLetters.fille
  );
  const garconMasked = computeMaskedNameFromIndices(
    config.names.garcon,
    config.revealedLetters.garcon
  );

  return {
    enabled: true,
    displayMode: "dual",
    variants: [
      { key: "fille", ...VARIANT_META.fille, ...filleMasked },
      { key: "garcon", ...VARIANT_META.garcon, ...garconMasked },
    ],
    isFullyRevealed: filleMasked.isFullyRevealed && garconMasked.isFullyRevealed,
    winningKey: null,
  };
}

async function getNamesFromSupabase(): Promise<{
  fille: string;
  garcon: string;
} | null> {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("reveal_settings")
    .select("baby_name_fille, baby_name_garcon, baby_name")
    .eq("id", 1)
    .single();

  if (error || !data) return null;

  const fille = data.baby_name_fille ?? data.baby_name;
  const garcon = data.baby_name_garcon;
  if (!fille || !garcon) return null;

  return { fille, garcon };
}

function getNamesFromEnv(): { fille: string; garcon: string } | null {
  const fille = process.env.BABY_NAME_FILLE?.trim();
  const garcon = process.env.BABY_NAME_GARCON?.trim();
  if (!fille || !garcon) return null;
  return { fille, garcon };
}

export async function getMysteryNameConfig(): Promise<MysteryNameConfig | null> {
  const names = (await getNamesFromSupabase()) ?? getNamesFromEnv();
  if (!names) return null;

  const stored = await getNameGameStoredState();

  return {
    names,
    revealedLetters: stored.revealedLetters,
    winnerOnly: stored.winnerOnly,
    source: (await getNamesFromSupabase()) ? "supabase" : "env",
  };
}

export async function getMaskedNameState(): Promise<
  MysteryNameGameState | { enabled: false }
> {
  const revealConfig = await getRevealConfig();
  if (!revealConfig?.nameGameEnabled) return { enabled: false };

  const config = await getMysteryNameConfig();
  if (!config) return { enabled: false };

  const state = buildVariants(config);

  if (shouldShowSingleName(config, revealConfig.result)) {
    const winner = revealConfig.result;
    const winnerVariant = state.variants.find((v) => v.key === winner);
    if (!winnerVariant) return { enabled: false };

    state.displayMode = "single";
    state.variants = [{ ...winnerVariant, ...SINGLE_VARIANT_META[winner] }];
    state.winningKey = winner;
    state.isFullyRevealed = winnerVariant.isFullyRevealed;
  }

  return state;
}

export async function checkNameGuess(
  guess: string,
  options?: { sessionId?: string }
): Promise<{
  feedback: "correct" | "wrong" | "disabled";
  saved: boolean;
}> {
  const revealConfig = await getRevealConfig();
  if (!revealConfig?.nameGameEnabled) {
    return { feedback: "disabled", saved: false };
  }

  const config = await getMysteryNameConfig();
  if (!config) return { feedback: "disabled", saved: false };

  const normalizedGuess = normalizeGuess(guess);
  if (!normalizedGuess) return { feedback: "wrong", saved: false };

  const winningKey = shouldShowSingleName(config, revealConfig.result)
    ? revealConfig.result
    : null;

  if (!winningKey) {
    return {
      feedback: "wrong",
      saved: await saveGuess(guess, options?.sessionId),
    };
  }

  const winningName = config.names[winningKey];
  const winningMasked = computeMaskedNameFromIndices(
    winningName,
    config.revealedLetters[winningKey]
  );

  if (!winningMasked.isFullyRevealed) {
    return {
      feedback: "wrong",
      saved: await saveGuess(guess, options?.sessionId),
    };
  }

  const isCorrect = normalizedGuess === normalizeBabyName(winningName);

  return {
    feedback: isCorrect ? "correct" : "wrong",
    saved: await saveGuess(guess, options?.sessionId),
  };
}

export async function updateRevealedLetters(
  revealedLetters: { fille: number[]; garcon: number[] },
  winnerOnly?: boolean
): Promise<{ ok: boolean; error?: string; warning?: string }> {
  const config = await getMysteryNameConfig();
  if (!config) {
    return { ok: false, error: "Prénoms non configurés" };
  }

  const stored = await getNameGameStoredState();
  const result = await saveNameGameStoredState(
    {
      revealedLetters,
      winnerOnly: winnerOnly ?? stored.winnerOnly,
    },
    config.names
  );

  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    warning: result.usedLocalFallback ? result.error : undefined,
  };
}

async function saveGuess(guess: string, sessionId?: string): Promise<boolean> {
  const { createServiceClient } = await import("@/lib/supabase/admin");
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { error } = await supabase.from("name_guesses").insert({
    guess: guess.trim().slice(0, 80),
    session_id: sessionId ?? null,
  });

  return !error;
}

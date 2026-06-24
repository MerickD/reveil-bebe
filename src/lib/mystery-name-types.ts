import type { VoteChoice } from "@/types/votes";

export interface MysteryNameConfig {
  names: {
    fille: string;
    garcon: string;
  };
  revealedLetters: {
    fille: number[];
    garcon: number[];
  };
  winnerOnly: boolean;
  source: "supabase" | "env";
}

export interface NameSlot {
  type: "letter" | "space" | "separator";
  value: string;
  isRevealed: boolean;
  index?: number;
}

export interface MaskedNameResult {
  slots: NameSlot[];
  revealedCount: number;
  totalLetters: number;
  isFullyRevealed: boolean;
}

export interface MaskedNameVariant extends MaskedNameResult {
  key: VoteChoice;
  label: string;
  emoji: string;
}

export interface MysteryNameGameState {
  enabled: true;
  displayMode: "dual" | "single";
  variants: MaskedNameVariant[];
  isFullyRevealed: boolean;
  winningKey: VoteChoice | null;
}

export type RevealedLettersState = MysteryNameConfig["revealedLetters"];

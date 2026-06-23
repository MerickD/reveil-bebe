import type { VoteChoice } from "@/types/votes";

/** Délai pendant lequel un vote peut être modifié (5 minutes) */
export const VOTE_EDIT_WINDOW_MS = 5 * 60 * 1000;

export interface VoteRecord {
  choice: VoteChoice;
  createdAt: string;
  canModify: boolean;
  remainingMs: number;
}

export function canModifyVote(createdAt: string, now = Date.now()): boolean {
  return now - new Date(createdAt).getTime() < VOTE_EDIT_WINDOW_MS;
}

export function getRemainingEditMs(createdAt: string, now = Date.now()): number {
  const elapsed = now - new Date(createdAt).getTime();
  return Math.max(0, VOTE_EDIT_WINDOW_MS - elapsed);
}

export function formatRemainingTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return sec > 0 ? `${min} min ${sec} s` : `${min} min`;
  return `${sec} s`;
}

export function normalizeVoterName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) return null;

  return name;
}

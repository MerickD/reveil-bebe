import { VoteChoice } from "@/types/votes";

const SESSION_KEY = "reveil-bebe-session-id";
const VOTE_KEY = "reveil-bebe-vote";
const VOTE_AT_KEY = "reveil-bebe-vote-at";
const VOTER_NAME_KEY = "reveil-bebe-voter-name";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function getStoredVote(): VoteChoice | null {
  if (typeof window === "undefined") return null;
  const vote = localStorage.getItem(VOTE_KEY);
  return vote === "fille" || vote === "garcon" ? vote : null;
}

export function getStoredVoteCreatedAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VOTE_AT_KEY);
}

export function storeVote(choice: VoteChoice, createdAt: string): void {
  localStorage.setItem(VOTE_KEY, choice);
  localStorage.setItem(VOTE_AT_KEY, createdAt);
}

export function getStoredVoterName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(VOTER_NAME_KEY) ?? "";
}

export function storeVoterName(name: string): void {
  localStorage.setItem(VOTER_NAME_KEY, name);
}

export function clearStoredVote(): void {
  localStorage.removeItem(VOTE_KEY);
  localStorage.removeItem(VOTE_AT_KEY);
  localStorage.removeItem(VOTER_NAME_KEY);
}

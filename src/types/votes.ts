export type VoteChoice = "fille" | "garcon";

export interface Vote {
  id: string;
  choice: VoteChoice;
  session_id: string;
  voter_name: string;
  created_at: string;
}

export interface VoteStats {
  fille: number;
  garcon: number;
  total: number;
  fillePercent: number;
  garconPercent: number;
}

export function computeStats(votes: Pick<Vote, "choice">[]): VoteStats {
  const fille = votes.filter((v) => v.choice === "fille").length;
  const garcon = votes.filter((v) => v.choice === "garcon").length;
  const total = fille + garcon;

  return {
    fille,
    garcon,
    total,
    fillePercent: total > 0 ? Math.round((fille / total) * 100) : 50,
    garconPercent: total > 0 ? Math.round((garcon / total) * 100) : 50,
  };
}

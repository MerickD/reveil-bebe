import { createClient } from "@supabase/supabase-js";
import type { Vote } from "@/types/votes";

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getAllVotes(): Promise<Pick<Vote, "choice">[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("votes").select("choice");

  if (error) {
    console.error("Erreur lors de la récupération des votes:", error.message);
    return [];
  }

  return data ?? [];
}

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Vote } from "@/types/votes";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createSupabaseClient(url, key);
}

export type Database = {
  public: {
    Tables: {
      votes: {
        Row: Vote;
        Insert: {
          choice: Vote["choice"];
          session_id: string;
          voter_name: string;
        };
        Update: never;
      };
    };
  };
};

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Vote } from "@/types/votes";

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type Database = {
  public: {
    Tables: {
      votes: {
        Row: Vote;
        Insert: {
          choice: Vote["choice"];
          session_id: string;
        };
        Update: never;
      };
    };
  };
};

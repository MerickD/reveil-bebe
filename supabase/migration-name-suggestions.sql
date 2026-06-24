-- ============================================================
-- Migration : propositions de prénoms par les visiteurs
-- Exécutez dans : Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.baby_name_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  suggested_name TEXT NOT NULL,
  proposer_name TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT suggested_name_length CHECK (char_length(trim(suggested_name)) >= 2),
  CONSTRAINT proposer_name_length CHECK (char_length(trim(proposer_name)) >= 2)
);

CREATE INDEX IF NOT EXISTS baby_name_suggestions_created_at_idx
  ON public.baby_name_suggestions (created_at DESC);

ALTER TABLE public.baby_name_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insertion publique des propositions"
  ON public.baby_name_suggestions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(suggested_name)) >= 2
    AND char_length(trim(proposer_name)) >= 2
  );

-- Pas de policy SELECT : consultation admin via service_role uniquement

ALTER TABLE public.reveal_settings
  ADD COLUMN IF NOT EXISTS name_suggestions_enabled BOOLEAN NOT NULL DEFAULT false;

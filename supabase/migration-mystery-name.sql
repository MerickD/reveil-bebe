-- ============================================================
-- Migration : Jeu du Prénom Mystère
-- Exécutez dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- Prénoms secrets + date de début du jeu (lecture service_role uniquement)
ALTER TABLE public.reveal_settings
  ADD COLUMN IF NOT EXISTS baby_name TEXT,
  ADD COLUMN IF NOT EXISTS baby_name_fille TEXT,
  ADD COLUMN IF NOT EXISTS baby_name_garcon TEXT,
  ADD COLUMN IF NOT EXISTS name_game_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS name_game_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS name_game_winner_only BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS name_game_state JSONB NOT NULL DEFAULT '{"revealedLetters":{"fille":[],"garcon":[]},"winnerOnly":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS revealed_letters_fille JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS revealed_letters_garcon JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Exemple (adaptez les prénoms et les dates) :
-- UPDATE public.reveal_settings
-- SET
--   baby_name_fille = 'Leïlany',
--   baby_name_garcon = 'Shayonn',
--   name_game_start_at = '2026-04-01T08:00:00+02:00'
-- WHERE id = 1;

-- Tentatives de devinette (optionnel — pour le fun / stats admin)
CREATE TABLE IF NOT EXISTS public.name_guesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guess TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS name_guesses_created_at_idx
  ON public.name_guesses (created_at DESC);

ALTER TABLE public.name_guesses ENABLE ROW LEVEL SECURITY;

-- Insertion publique anonyme, pas de lecture côté visiteur
CREATE POLICY "Insertion publique des tentatives"
  ON public.name_guesses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (char_length(trim(guess)) >= 2);

-- Aucune policy SELECT : consultation admin via service_role uniquement

-- Migration rapide : colonnes manquantes pour le jeu du prénom
-- Copiez-collez dans Supabase > SQL Editor > Run

ALTER TABLE public.reveal_settings
  ADD COLUMN IF NOT EXISTS name_game_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS name_game_winner_only BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS name_game_state JSONB NOT NULL DEFAULT '{"revealedLetters":{"fille":[],"garcon":[]},"winnerOnly":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS revealed_letters_fille JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS revealed_letters_garcon JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS baby_name_fille TEXT,
  ADD COLUMN IF NOT EXISTS baby_name_garcon TEXT;

-- Optionnel : renseigner les prénoms directement en base
-- UPDATE public.reveal_settings
-- SET baby_name_fille = 'Leïlany', baby_name_garcon = 'Shayonn'
-- WHERE id = 1;

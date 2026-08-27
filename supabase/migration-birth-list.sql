-- ============================================================
-- Migration : affichage de la liste de naissance (toggle admin)
-- Exécutez dans : Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.reveal_settings
  ADD COLUMN IF NOT EXISTS birth_list_enabled BOOLEAN NOT NULL DEFAULT false;

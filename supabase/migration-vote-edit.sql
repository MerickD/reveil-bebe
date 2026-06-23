-- Migration : autoriser la modification d'un vote dans les 5 minutes
-- Exécutez dans Supabase SQL Editor si la table votes existe déjà

ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Policy UPDATE : uniquement dans les 5 minutes suivant le vote initial
DROP POLICY IF EXISTS "Modification vote sous 5 minutes" ON public.votes;

CREATE POLICY "Modification vote sous 5 minutes"
  ON public.votes
  FOR UPDATE
  TO anon, authenticated
  USING (created_at > NOW() - INTERVAL '5 minutes')
  WITH CHECK (
    choice IN ('fille', 'garcon')
    AND created_at > NOW() - INTERVAL '5 minutes'
  );

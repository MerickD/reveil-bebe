-- Migration : prénom du votant (visible uniquement dans Supabase pour vous)
-- Exécutez dans Supabase Dashboard > SQL Editor

ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS voter_name TEXT;

-- Votes déjà enregistrés sans prénom
UPDATE public.votes
SET voter_name = 'Inconnu'
WHERE voter_name IS NULL OR TRIM(voter_name) = '';

ALTER TABLE public.votes
  ALTER COLUMN voter_name SET NOT NULL;

-- Le public peut lire les choix (stats live) mais pas les prénoms
REVOKE SELECT ON public.votes FROM anon, authenticated;
GRANT SELECT (id, choice, session_id, created_at) ON public.votes TO anon, authenticated;

GRANT INSERT (choice, session_id, voter_name) ON public.votes TO anon, authenticated;
GRANT UPDATE (choice) ON public.votes TO anon, authenticated;

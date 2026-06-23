-- ============================================================
-- Schéma Supabase pour l'application Révélation Bébé
-- Exécutez ce script dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- Table des votes
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  choice TEXT NOT NULL CHECK (choice IN ('fille', 'garcon')),
  session_id TEXT NOT NULL,
  voter_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Un seul vote par session (navigateur)
CREATE UNIQUE INDEX IF NOT EXISTS votes_session_id_unique
  ON public.votes (session_id);

-- Index pour les agrégations
CREATE INDEX IF NOT EXISTS votes_choice_idx ON public.votes (choice);

-- Activer Row Level Security
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Lecture publique (pour les stats en temps réel)
CREATE POLICY "Lecture publique des votes"
  ON public.votes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insertion publique (un vote par session_id)
CREATE POLICY "Insertion publique des votes"
  ON public.votes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Modification possible dans les 5 minutes suivant le vote
CREATE POLICY "Modification vote sous 5 minutes"
  ON public.votes
  FOR UPDATE
  TO anon, authenticated
  USING (created_at > NOW() - INTERVAL '5 minutes')
  WITH CHECK (
    choice IN ('fille', 'garcon')
    AND created_at > NOW() - INTERVAL '5 minutes'
  );

-- Pas de suppression côté public

-- Prénoms réservés à la consultation dans Supabase (pas exposés via l'API publique)
REVOKE SELECT ON public.votes FROM anon, authenticated;
GRANT SELECT (id, choice, session_id, created_at) ON public.votes TO anon, authenticated;
GRANT INSERT (choice, session_id, voter_name) ON public.votes TO anon, authenticated;
GRANT UPDATE (choice) ON public.votes TO anon, authenticated;

-- ============================================================
-- Activer Supabase Realtime sur la table votes
-- Dashboard > Database > Replication > ajouter la table "votes"
-- OU via SQL :
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- ============================================================
-- Table de configuration de la révélation (admin)
-- Accessible uniquement via la clé service_role côté serveur
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reveal_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  reveal_at TIMESTAMPTZ NOT NULL,
  result TEXT CHECK (result IS NULL OR result IN ('fille', 'garcon')),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.reveal_settings ENABLE ROW LEVEL SECURITY;
-- Aucune policy publique : lecture/écriture via service_role uniquement

-- Valeurs initiales (adaptez la date et le résultat)
INSERT INTO public.reveal_settings (id, reveal_at, result)
VALUES (1, '2026-07-15T16:00:00+00:00', 'fille')
ON CONFLICT (id) DO NOTHING;

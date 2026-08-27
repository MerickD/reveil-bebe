-- ============================================================
-- Migration : notifications email aux visiteurs
-- Exécutez dans : Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.reveal_settings
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.notification_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  session_id TEXT,
  unsubscribe_token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT notification_email_format CHECK (
    char_length(trim(email)) >= 5
    AND position('@' in email) > 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_subscribers_email_unique
  ON public.notification_subscribers (lower(trim(email)));

CREATE INDEX IF NOT EXISTS notification_subscribers_active_idx
  ON public.notification_subscribers (active)
  WHERE active = true;

ALTER TABLE public.notification_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insertion publique des abonnements"
  ON public.notification_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(email)) >= 5
    AND position('@' in email) > 1
  );

-- Pas de policy SELECT/UPDATE publique : admin via service_role uniquement

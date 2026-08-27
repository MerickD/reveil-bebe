-- Nettoyage : suppression des notifications email
-- À exécuter dans Supabase → SQL Editor (optionnel)

DROP TABLE IF EXISTS public.notification_subscribers;

ALTER TABLE public.reveal_settings
  DROP COLUMN IF EXISTS notifications_enabled;

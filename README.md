# Révélation Bébé — Fille ou Garçon ?

Application Next.js 15 pour une annonce de sexe de bébé avec votes en temps réel via Supabase.

## Démarrage rapide

```bash
cd reveil-bebe
npm install
cp .env.example .env.local
# Remplissez les variables dans .env.local
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Configuration Supabase

Voir les étapes détaillées ci-dessous dans la section **Base de données**.

## Variables d'environnement

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (admin + reveal_settings) |
| `NEXT_PUBLIC_REVEAL_DATE` | Date/heure de révélation (fallback) |
| `REVEAL_RESULT` | `fille` ou `garcon` (fallback) |
| `NEXT_PUBLIC_SITE_URL` | URL publique pour le partage |
| `ADMIN_PASSWORD` | Mot de passe page `/admin` |

## Fonctionnalités

- **Partage social** : WhatsApp, copier le lien, partage natif (mobile)
- **Page admin** (`/admin`) : modifier date et résultat via Supabase

## Structure

```
src/
  app/           → Pages et API routes
  components/    → Countdown, VoteButtons, StatsDisplay, RevealResult
  lib/supabase/  → Clients Supabase (browser + server)
  types/         → Types TypeScript
supabase/
  schema.sql     → Schéma SQL à exécuter dans Supabase
```

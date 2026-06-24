"use client";

import { useEffect, useState } from "react";
import AdminLetterPicker, {
  type RevealedLettersState,
} from "@/components/AdminLetterPicker";
import type { VoteChoice } from "@/types/votes";

interface NameSuggestionRow {
  id: string;
  suggestedName: string;
  proposerName: string;
  createdAt: string;
}

function formatSuggestionDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

const inputClass =
  "w-full rounded-xl border border-[#e0d4f0] bg-white/95 px-4 py-3 text-[#5c4f56] outline-none focus:border-[var(--color-floral-lavender)] focus:ring-2 focus:ring-[#e0d4f0]";

const labelClass = "mb-1 block text-sm font-semibold text-[#5c4f56]";

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [revealDate, setRevealDate] = useState("");
  const [result, setResult] = useState<VoteChoice | "">("");
  const [nameGameEnabled, setNameGameEnabled] = useState(false);
  const [nameSuggestionsEnabled, setNameSuggestionsEnabled] = useState(false);
  const [nameGameWinnerOnly, setNameGameWinnerOnly] = useState(false);
  const [names, setNames] = useState<{ fille: string; garcon: string } | null>(
    null
  );
  const [revealedLetters, setRevealedLetters] = useState<RevealedLettersState>({
    fille: [],
    garcon: [],
  });
  const [source, setSource] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<NameSuggestionRow[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((data) => {
        setEnabled(data.enabled !== false);
        setAuthenticated(data.authenticated === true);
      })
      .catch(() => {
        setConnectionError(
          "Impossible de joindre le serveur. Relancez npm run dev dans le projet."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    setLoadError(null);
    fetch("/api/admin/settings")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error ?? "Impossible de charger la configuration");
        }
        return data;
      })
      .then((data) => {
        if (data.revealDate) {
          setRevealDate(toLocalDatetimeValue(data.revealDate));
          setResult(data.result ?? "");
          setNameGameEnabled(data.nameGameEnabled === true);
          setNameSuggestionsEnabled(data.nameSuggestionsEnabled === true);
          setNameGameWinnerOnly(data.nameGameWinnerOnly === true);
          setNames(data.names ?? null);
          setRevealedLetters(
            data.revealedLetters ?? { fille: [], garcon: [] }
          );
          setSource(data.source ?? "");
        }
      })
      .catch((err: Error) => {
        setLoadError(err.message);
      });
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;

    setSuggestionsLoading(true);
    fetch("/api/admin/name-suggestions")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) return { suggestions: [] as NameSuggestionRow[] };
        return data as { suggestions: NameSuggestionRow[] };
      })
      .then((data) => setSuggestions(data.suggestions ?? []))
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestionsLoading(false));
  }, [authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuthenticated(true);
        setPassword("");
      } else {
        setLoginError(data.error ?? "Erreur de connexion");
      }
    } catch {
      setLoginError("Connexion impossible. Réessayez dans un instant.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setLoadError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revealDate: new Date(revealDate).toISOString(),
          result: result === "" ? null : result,
          nameGameEnabled,
          nameSuggestionsEnabled,
          nameGameWinnerOnly,
          revealedLetters,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveMessage(
          data.warning
            ? `Enregistré (mode local). ${data.warning}`
            : "Configuration enregistrée !"
        );
        setSource("supabase");
      } else {
        setSaveMessage(data.error ?? "Erreur lors de l'enregistrement");
      }
    } catch {
      setSaveMessage("Erreur réseau lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-floral-lavender-light)] border-t-[var(--color-floral-rose)]" />
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="rounded-2xl bg-[var(--color-floral-peach)]/30 p-6 text-center ring-1 ring-[#f0cbb8]">
        <p className="font-semibold text-[#5c4f56]">Page admin désactivée</p>
        <p className="mt-2 text-sm text-[#8a7d84]">
          Ajoutez{" "}
          <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">
            ADMIN_PASSWORD
          </code>{" "}
          dans votre fichier{" "}
          <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">
            .env.local
          </code>
        </p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label htmlFor="password" className={labelClass}>
            Mot de passe admin
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
            required
          />
        </div>
        {connectionError && (
          <p className="rounded-xl bg-[var(--color-floral-rose-light)]/50 px-4 py-2 text-sm font-medium text-[var(--color-floral-rose-dark)]">
            {connectionError}
          </p>
        )}
        {loginError && (
          <p className="rounded-xl bg-[var(--color-floral-rose-light)]/50 px-4 py-2 text-sm font-medium text-[var(--color-floral-rose-dark)]">
            {loginError}
          </p>
        )}
        <button
          type="submit"
          className="rounded-xl bg-[var(--color-floral-lavender)] px-6 py-3 font-bold text-white shadow-sm transition hover:brightness-105 active:scale-[0.98]"
        >
          Se connecter
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#8a7d84]">
          Source :{" "}
          <span className="font-semibold text-[#5c4f56]">
            {source === "supabase" ? "Supabase" : "Variables d'environnement"}
          </span>
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-medium text-[#a890c0] underline hover:text-[var(--color-floral-rose)]"
        >
          Déconnexion
        </button>
      </div>

      {loadError && (
        <p className="rounded-xl bg-[var(--color-floral-rose-light)]/50 px-4 py-3 text-sm font-medium text-[var(--color-floral-rose-dark)]">
          {loadError}
        </p>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div>
          <label htmlFor="revealDate" className={labelClass}>
            Date et heure de révélation
          </label>
          <input
            id="revealDate"
            type="datetime-local"
            value={revealDate}
            onChange={(e) => setRevealDate(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="result" className={labelClass}>
            Résultat secret
          </label>
          <select
            id="result"
            value={result}
            onChange={(e) => setResult(e.target.value as VoteChoice | "")}
            className={inputClass}
          >
            <option value="">— Pas encore défini —</option>
            <option value="fille">🌸 Fille</option>
            <option value="garcon">🌿 Garçon</option>
          </select>
          <p className="mt-1.5 text-xs leading-relaxed text-[#8a7d84]">
            Annonce uniquement le sexe du bébé — le prénom reste géré
            séparément dans le jeu des lettres ci-dessous.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e0d4f0] bg-[var(--color-floral-lavender-light)]/40 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={nameGameEnabled}
              onChange={(e) => setNameGameEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#d8cce8] text-[var(--color-floral-lavender)] focus:ring-[var(--color-floral-lavender)]"
            />
            <span>
              <span className="block text-sm font-semibold text-[#5c4f56]">
                Activer le jeu du prénom
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-[#8a7d84]">
                Le jeu s&apos;affiche dès que cette case est cochée, indépendamment
                du compte à rebours. Au départ, aucune lettre n&apos;est visible.
              </span>
            </span>
          </label>
        </div>

        <div className="rounded-2xl border border-[#e0d4f0] bg-[var(--color-floral-peach)]/30 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={nameSuggestionsEnabled}
              onChange={(e) => setNameSuggestionsEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#f0cbb8] text-[var(--color-floral-peach)] focus:ring-[var(--color-floral-peach)]"
            />
            <span>
              <span className="block text-sm font-semibold text-[#5c4f56]">
                Activer les propositions de prénoms
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-[#8a7d84]">
                Les visiteurs peuvent suggérer un prénom pour bébé. Indépendant
                du jeu du prénom et du compte à rebours.
              </span>
            </span>
          </label>
        </div>

        {nameGameEnabled && (
          <div className="rounded-2xl border border-[#e0d4f0] bg-white/80 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={nameGameWinnerOnly}
                onChange={(e) => setNameGameWinnerOnly(e.target.checked)}
                disabled={!result}
                className="mt-1 h-4 w-4 rounded border-[#d8cce8] text-[var(--color-floral-lavender)] focus:ring-[var(--color-floral-lavender)] disabled:opacity-40"
              />
              <span>
                <span className="block text-sm font-semibold text-[#5c4f56]">
                  N&apos;afficher qu&apos;un seul prénom
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[#8a7d84]">
                  Affiche uniquement le prénom lié au résultat fille/garçon.
                  Indépendant du compte à rebours — activez quand vous voulez
                  (nécessite un résultat défini ci-dessus).
                </span>
              </span>
            </label>
          </div>
        )}

        {nameGameEnabled && names && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-[#5c4f56]">
              Lettres visibles sur le site
            </p>
            <p className="text-xs leading-relaxed text-[#8a7d84]">
              Cliquez sur une lettre pour la révéler ou la masquer. Les visiteurs
              ne voient que les lettres activées (les autres apparaissent en ?).
            </p>
            <AdminLetterPicker
              name={names.fille}
              label="Prénom fille"
              emoji="🌸"
              accent="fille"
              indices={revealedLetters.fille}
              onChange={(fille) =>
                setRevealedLetters((prev) => ({ ...prev, fille }))
              }
            />
            <AdminLetterPicker
              name={names.garcon}
              label="Prénom garçon"
              emoji="🌿"
              accent="garcon"
              indices={revealedLetters.garcon}
              onChange={(garcon) =>
                setRevealedLetters((prev) => ({ ...prev, garcon }))
              }
            />
          </div>
        )}

        {nameGameEnabled && !names && (
          <p className="rounded-xl bg-[var(--color-floral-peach)]/30 px-4 py-3 text-sm text-[#8a7d84] ring-1 ring-[#f0cbb8]">
            Configurez{" "}
            <code className="rounded bg-white/80 px-1">BABY_NAME_FILLE</code> et{" "}
            <code className="rounded bg-white/80 px-1">BABY_NAME_GARCON</code>{" "}
            dans Supabase ou <code className="rounded bg-white/80 px-1">.env.local</code>{" "}
            pour gérer les lettres.
          </p>
        )}

        {saveMessage && (
          <p
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              saveMessage.includes("Erreur") ||
              saveMessage.includes("erreur") ||
              saveMessage.includes("non")
                ? "bg-[var(--color-floral-rose-light)]/50 text-[var(--color-floral-rose-dark)]"
                : "bg-[var(--color-floral-sage-light)]/60 text-[var(--color-floral-sage-dark)]"
            }`}
          >
            {saveMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !revealDate}
          className="rounded-xl bg-[var(--color-floral-lavender)] px-6 py-3 font-bold text-white shadow-sm transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <div className="rounded-2xl border border-[#e0d4f0] bg-white/80 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#5c4f56]">
            Propositions de prénoms
          </p>
          <button
            type="button"
            onClick={() => {
              setSuggestionsLoading(true);
              fetch("/api/admin/name-suggestions")
                .then((r) => r.json())
                .then((data) => setSuggestions(data.suggestions ?? []))
                .finally(() => setSuggestionsLoading(false));
            }}
            className="text-xs font-medium text-[#a890c0] underline hover:text-[var(--color-floral-rose)]"
          >
            Actualiser
          </button>
        </div>

        {suggestionsLoading ? (
          <p className="text-sm text-[#8a7d84]">Chargement…</p>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-[#8a7d84]">
            Aucune proposition pour le moment.
          </p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {suggestions.map((item) => (
              <li
                key={item.id}
                className="rounded-xl bg-[var(--color-floral-lavender-light)]/40 px-3 py-2.5 text-sm ring-1 ring-[#ebe3ef]"
              >
                <p className="font-semibold text-[#5c4f56]">
                  {item.suggestedName}
                </p>
                <p className="mt-0.5 text-xs text-[#8a7d84]">
                  par {item.proposerName} — {formatSuggestionDate(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="rounded-2xl bg-white/70 p-4 text-xs leading-relaxed text-[#8a7d84] ring-1 ring-[#ebe3ef]">
        Les modifications sont stockées dans Supabase (table{" "}
        <code className="rounded bg-[var(--color-floral-lavender-light)] px-1">
          reveal_settings
        </code>
        ). Si l&apos;enregistrement échoue, exécutez la migration SQL{" "}
        <code className="rounded bg-[var(--color-floral-lavender-light)] px-1">
          migration-mystery-name.sql
        </code>{" "}
        dans Supabase.
      </p>
    </div>
  );
}

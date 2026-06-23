"use client";

import { useEffect, useState } from "react";
import type { VoteChoice } from "@/types/votes";

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [revealDate, setRevealDate] = useState("");
  const [result, setResult] = useState<VoteChoice | "">("");
  const [source, setSource] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((data) => {
        setEnabled(data.enabled !== false);
        setAuthenticated(data.authenticated === true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.revealDate) {
          setRevealDate(toLocalDatetimeValue(data.revealDate));
          setResult(data.result ?? "");
          setSource(data.source ?? "");
        }
      });
  }, [authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setAuthenticated(true);
      setPassword("");
    } else {
      const data = await res.json();
      setLoginError(data.error ?? "Erreur de connexion");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revealDate: new Date(revealDate).toISOString(),
        result: result === "" ? null : result,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setSaveMessage("Configuration enregistrée !");
      setSource("supabase");
    } else {
      setSaveMessage(data.error ?? "Erreur lors de l'enregistrement");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-500" />
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-center text-amber-700">
        <p className="font-medium">Page admin désactivée</p>
        <p className="mt-2 text-sm">
          Ajoutez <code className="rounded bg-amber-100 px-1">ADMIN_PASSWORD</code> dans
          votre fichier <code className="rounded bg-amber-100 px-1">.env.local</code>
        </p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-violet-700"
          >
            Mot de passe admin
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-violet-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
            placeholder="••••••••"
            required
          />
        </div>
        {loginError && (
          <p className="text-sm text-red-500">{loginError}</p>
        )}
        <button
          type="submit"
          className="rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 active:scale-[0.98]"
        >
          Se connecter
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-violet-500">
          Source : {source === "supabase" ? "Supabase" : "Variables d'environnement"}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-violet-400 underline hover:text-violet-600"
        >
          Déconnexion
        </button>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="revealDate"
            className="mb-1 block text-sm font-medium text-violet-700"
          >
            Date et heure de révélation
          </label>
          <input
            id="revealDate"
            type="datetime-local"
            value={revealDate}
            onChange={(e) => setRevealDate(e.target.value)}
            className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-violet-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
            required
          />
        </div>

        <div>
          <label
            htmlFor="result"
            className="mb-1 block text-sm font-medium text-violet-700"
          >
            Résultat secret
          </label>
          <select
            id="result"
            value={result}
            onChange={(e) =>
              setResult(e.target.value as VoteChoice | "")
            }
            className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-violet-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
          >
            <option value="">— Pas encore défini —</option>
            <option value="fille">👧 Fille</option>
            <option value="garcon">👦 Garçon</option>
          </select>
        </div>

        {saveMessage && (
          <p
            className={`text-sm ${saveMessage.includes("Erreur") || saveMessage.includes("non") ? "text-red-500" : "text-green-600"}`}
          >
            {saveMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <p className="rounded-xl bg-violet-50 p-4 text-xs text-violet-500">
        Les modifications sont stockées dans Supabase (table{" "}
        <code className="rounded bg-violet-100 px-1">reveal_settings</code>).
        Nécessite <code className="rounded bg-violet-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
        dans <code className="rounded bg-violet-100 px-1">.env.local</code>.
      </p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionId } from "@/lib/session";

type SubmitState = "idle" | "submitting" | "success" | "already";

export default function NotifySignup() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchEnabled = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.enabled === true);
      } else {
        setEnabled(false);
      }
    } catch {
      setEnabled(false);
    }
  }, []);

  useEffect(() => {
    fetchEnabled();
  }, [fetchEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState === "submitting") return;

    setSubmitState("submitting");
    setError(null);

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim() || undefined,
          session_id: getSessionId(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossible d'enregistrer votre inscription.");
        setSubmitState("idle");
        return;
      }

      setSubmitState(data.alreadySubscribed ? "already" : "success");
      setEmail("");
      setFirstName("");
    } catch {
      setError("Connexion impossible. Réessayez dans un instant.");
      setSubmitState("idle");
    }
  };

  if (enabled === null || !enabled) {
    return null;
  }

  return (
    <section
      className="glass-card relative overflow-hidden rounded-[1.75rem] p-5 sm:p-7"
      aria-labelledby="notify-title"
    >
      <div className="pointer-events-none absolute -right-3 -top-3 text-2xl opacity-25">
        🔔
      </div>

      <div className="relative">
        <div className="mb-5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-floral-lavender-light)] px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#8a7ab0] ring-1 ring-[#d8cce8]">
            <span>💌</span> Rester informé
          </span>
          <h2
            id="notify-title"
            className="mt-3 text-xl font-extrabold text-[#5c4f56] sm:text-2xl"
          >
            Recevoir les nouveautés
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-[#8a7d84]">
            Laissez votre email : on vous prévient quand il y a une mise à jour
            (nouvelle lettre, révélation…). Aucun spam.
          </p>
        </div>

        {submitState === "success" || submitState === "already" ? (
          <p
            className="animate-reveal text-center text-sm font-bold text-[var(--color-floral-sage-dark)]"
            role="status"
          >
            {submitState === "already"
              ? "Vous êtes déjà inscrit(e) — merci !"
              : "C'est noté ! On vous tiendra au courant 💕"}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label
                htmlFor="notify-firstname"
                className="mb-1.5 block text-center text-sm font-semibold text-[#6d5f66]"
              >
                Prénom <span className="font-normal text-[#a890a0]">(optionnel)</span>
              </label>
              <input
                id="notify-firstname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex. Marie"
                maxLength={40}
                disabled={submitState === "submitting"}
                className="w-full rounded-xl border border-[#f0e8e4] bg-white/90 px-4 py-3 text-center text-[#5c4f56] outline-none placeholder:text-[#c4b8bc] focus:border-[var(--color-floral-lavender)] focus:ring-2 focus:ring-[var(--color-floral-lavender)]/40 disabled:opacity-60"
              />
            </div>
            <div>
              <label
                htmlFor="notify-email"
                className="mb-1.5 block text-center text-sm font-semibold text-[#6d5f66]"
              >
                Email
              </label>
              <input
                id="notify-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="vous@email.com"
                required
                maxLength={120}
                autoComplete="email"
                disabled={submitState === "submitting"}
                className="w-full rounded-xl border border-[#e0d4f0] bg-white/90 px-4 py-3 text-center text-[#5c4f56] outline-none placeholder:text-[#c4b8bc] focus:border-[var(--color-floral-lavender)] focus:ring-2 focus:ring-[var(--color-floral-lavender)]/40 disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={email.trim().length < 5 || submitState === "submitting"}
              className="min-h-11 rounded-xl bg-[var(--color-floral-lavender)] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitState === "submitting" ? "Inscription…" : "Me tenir informé(e)"}
            </button>
            <p className="text-center text-[11px] text-[#a890a0]">
              Vous pourrez vous désabonner à tout moment via un lien dans l&apos;email.
            </p>
          </form>
        )}

        {error && (
          <p
            className="mt-3 text-center text-sm font-medium text-[var(--color-floral-rose)]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

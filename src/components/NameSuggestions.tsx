"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionId, getStoredVoterName, storeVoterName } from "@/lib/session";
import { normalizeVoterName } from "@/lib/vote";

type SubmitState = "idle" | "submitting" | "success";

export default function NameSuggestions() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [proposerName, setProposerName] = useState("");
  const [suggestedName, setSuggestedName] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchEnabled = useCallback(async () => {
    try {
      const res = await fetch("/api/name-suggestions");
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
    setProposerName(getStoredVoterName());
    fetchEnabled();
  }, [fetchEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState === "submitting") return;

    const normalizedProposer = normalizeVoterName(proposerName);
    if (!normalizedProposer) {
      setError("Indiquez votre prénom (2 caractères minimum).");
      return;
    }

    const trimmedSuggestion = suggestedName.trim();
    if (trimmedSuggestion.length < 2) {
      setError("Indiquez un prénom d'au moins 2 caractères.");
      return;
    }

    setSubmitState("submitting");
    setError(null);

    try {
      const res = await fetch("/api/name-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggested_name: trimmedSuggestion,
          proposer_name: normalizedProposer,
          session_id: getSessionId(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossible d'envoyer votre proposition.");
        setSubmitState("idle");
        return;
      }

      storeVoterName(normalizedProposer);
      setSuggestedName("");
      setSubmitState("success");
      window.setTimeout(() => setSubmitState("idle"), 3500);
    } catch {
      setError("Connexion impossible. Réessayez dans un instant.");
      setSubmitState("idle");
    }
  };

  const canSubmit =
    submitState !== "submitting" &&
    Boolean(normalizeVoterName(proposerName)) &&
    suggestedName.trim().length >= 2;

  if (enabled === null || !enabled) {
    return null;
  }

  return (
    <section
      className="glass-card relative overflow-hidden rounded-[1.75rem] p-5 sm:p-7"
      aria-labelledby="name-suggestions-title"
    >
      <div className="pointer-events-none absolute -right-3 -top-3 text-2xl opacity-25">
        💌
      </div>

      <div className="relative">
        <div className="mb-5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-floral-peach)]/50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#b08070] ring-1 ring-[#f0cbb8]">
            <span>✨</span> Vos idées
          </span>
          <h2
            id="name-suggestions-title"
            className="mt-3 text-xl font-extrabold text-[#5c4f56] sm:text-2xl"
          >
            Proposez un prénom
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-[#8a7d84]">
            Une idée de prénom pour notre bébé ? Partagez-la avec nous — on
            lit tout avec attention !
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="suggestion-proposer"
              className="mb-1.5 block text-center text-sm font-semibold text-[#6d5f66]"
            >
              Votre prénom
            </label>
            <input
              id="suggestion-proposer"
              type="text"
              value={proposerName}
              onChange={(e) => {
                setProposerName(e.target.value);
                setError(null);
              }}
              placeholder="Ex. Marie"
              maxLength={40}
              autoComplete="name"
              disabled={submitState === "submitting"}
              className="w-full rounded-xl border border-[#f0e8e4] bg-white/90 px-4 py-3 text-center text-[#5c4f56] outline-none placeholder:text-[#c4b8bc] focus:border-[var(--color-floral-peach)] focus:ring-2 focus:ring-[var(--color-floral-peach)]/40 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="suggestion-name"
              className="mb-1.5 block text-center text-sm font-semibold text-[#6d5f66]"
            >
              Prénom proposé pour bébé
            </label>
            <input
              id="suggestion-name"
              type="text"
              value={suggestedName}
              onChange={(e) => {
                setSuggestedName(e.target.value);
                setError(null);
              }}
              placeholder="Ex. Léna, Noah…"
              maxLength={40}
              disabled={submitState === "submitting"}
              className="w-full rounded-xl border border-[#e0d4f0] bg-white/90 px-4 py-3 text-center text-[#5c4f56] outline-none placeholder:text-[#c4b8bc] focus:border-[var(--color-floral-lavender)] focus:ring-2 focus:ring-[var(--color-floral-lavender)]/40 disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="min-h-11 rounded-xl bg-[var(--color-floral-peach)] px-5 text-sm font-bold text-[#5c4f56] shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitState === "submitting" ? "Envoi…" : "Envoyer ma proposition"}
          </button>
        </form>

        {submitState === "success" && (
          <p
            className="mt-4 animate-reveal text-center text-sm font-bold text-[var(--color-floral-sage-dark)]"
            role="status"
          >
            Merci, c&apos;est noté ! 💕
          </p>
        )}

        {error && (
          <p
            className="mt-4 text-center text-sm font-medium text-[var(--color-floral-rose)]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

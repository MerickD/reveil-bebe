"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionId } from "@/lib/session";
import type { MaskedNameVariant, NameSlot } from "@/lib/mystery-name-types";
import type { VoteChoice } from "@/types/votes";

interface MysteryNameState {
  enabled: boolean;
  displayMode?: "dual" | "single";
  variants?: MaskedNameVariant[];
  isFullyRevealed?: boolean;
  winningKey?: VoteChoice | null;
}

type GuessFeedback = "idle" | "wrong" | "correct" | "submitting";

interface NameGuessingProps {
  className?: string;
}

function LetterBox({
  slot,
  accent,
}: {
  slot: NameSlot;
  accent: "fille" | "garcon";
}) {
  if (slot.type === "space") {
    return <span className="w-2 sm:w-3" aria-hidden />;
  }

  if (slot.type === "separator") {
    return (
      <span className="px-0.5 text-lg font-bold text-[#c4b0d8] sm:text-xl">
        {slot.value}
      </span>
    );
  }

  const revealedRing =
    accent === "fille" ? "ring-[#f48fb1]" : "ring-[#81c784]";

  return (
    <span
      className={`flex h-10 w-8 items-center justify-center rounded-xl text-base font-extrabold shadow-sm ring-1 sm:h-11 sm:w-9 sm:text-lg ${
        slot.isRevealed
          ? `bg-white text-[#5c4f56] ${revealedRing}`
          : "bg-[var(--color-floral-lavender-light)] text-[#a890c0] ring-[#d8cce8]"
      }`}
      aria-label={slot.isRevealed ? `Lettre ${slot.value}` : "Lettre cachée"}
    >
      {slot.value}
    </span>
  );
}

function NameRow({
  variant,
  isWinner,
}: {
  variant: MaskedNameVariant;
  isWinner: boolean;
}) {
  const accent = variant.key;
  const accentText =
    accent === "fille"
      ? "text-[var(--color-floral-rose-dark)]"
      : "text-[var(--color-floral-sage-dark)]";

  return (
    <div
      className={`rounded-2xl p-4 ring-1 ${
        isWinner
          ? "bg-white/95 ring-2 ring-[var(--color-floral-lavender)]"
          : "bg-white/60 ring-[#ebe3ef]"
      }`}
    >
      <p
        className={`mb-3 text-center text-xs font-bold uppercase tracking-widest ${accentText}`}
      >
        <span className="mr-1">{variant.emoji}</span>
        {variant.label}
        {isWinner ? (
          <span className="mt-1 block text-[10px] font-semibold normal-case tracking-normal text-[#5c4f56]">
            C&apos;est le bon prénom !
          </span>
        ) : null}
      </p>

      <div
        className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5"
        role="img"
        aria-label={`Prénom mystère ${variant.label}`}
      >
        {variant.slots.map((slot, index) => (
          <LetterBox
            key={`${variant.key}-${slot.type}-${index}`}
            slot={slot}
            accent={accent}
          />
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] font-medium text-[#8a7d84]">
        {variant.revealedCount} / {variant.totalLetters} lettres débloquées
      </p>
    </div>
  );
}

export default function NameGuessing({ className = "" }: NameGuessingProps) {
  const [state, setState] = useState<MysteryNameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<GuessFeedback>("idle");

  const fetchMaskedName = useCallback(async () => {
    try {
      const res = await fetch("/api/mystery-name");
      if (res.ok) {
        const data: MysteryNameState = await res.json();
        setState(data);
      } else {
        setState({ enabled: false });
      }
    } catch {
      setState({ enabled: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaskedName();
  }, [fetchMaskedName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || feedback === "submitting") return;

    setFeedback("submitting");

    try {
      const res = await fetch("/api/mystery-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guess: guess.trim(),
          session_id: getSessionId(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.feedback === "correct") {
        setFeedback("correct");
      } else {
        setFeedback("wrong");
      }
    } catch {
      setFeedback("wrong");
    }

    window.setTimeout(() => setFeedback("idle"), 2800);
  };

  if (loading) {
    return (
      <section
        className={`glass-card flex min-h-[140px] items-center justify-center rounded-[1.75rem] p-5 ${className}`}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-floral-lavender)] border-t-[var(--color-floral-rose)]" />
      </section>
    );
  }

  if (!state?.enabled || !state.variants?.length) {
    return null;
  }

  const isSingle = state.displayMode === "single";

  const progressLabel = state.isFullyRevealed
    ? "Toutes les lettres sont dévoilées !"
    : "Revenez bientôt — de nouvelles lettres pourraient apparaître…";

  return (
    <section
      className={`glass-card relative overflow-hidden rounded-[1.75rem] p-5 sm:p-7 ${className}`}
      aria-labelledby="mystery-name-title"
    >
      <div className="pointer-events-none absolute -right-3 -top-3 text-2xl opacity-25">
        ✨
      </div>
      <div className="pointer-events-none absolute -bottom-2 -left-2 text-xl opacity-25">
        🔮
      </div>

      <div className="relative">
        <div className="mb-5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-floral-lavender-light)] px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#8a7ab0] ring-1 ring-[#d8cce8]">
            <span>🎀</span> Jeu du prénom
          </span>
          <h2
            id="mystery-name-title"
            className="mt-3 text-xl font-extrabold text-[#5c4f56] sm:text-2xl"
          >
            {isSingle ? "Devinez son prénom" : "Devinez le prénom mystère"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-[#8a7d84]">
            {isSingle
              ? "Revenez régulièrement : une nouvelle lettre pourra apparaître à tout moment !"
              : "Deux prénoms possibles selon le sexe du bébé. Revenez chaque semaine — une lettre pourrait bien se dévoiler…"}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {state.variants.map((variant) => (
            <NameRow
              key={variant.key}
              variant={variant}
              isWinner={
                isSingle ||
                (Boolean(state.isFullyRevealed) &&
                  state.winningKey === variant.key)
              }
            />
          ))}
        </div>

        <p className="mt-4 text-center text-xs font-semibold uppercase tracking-wider text-[#a890c0]">
          {progressLabel}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch"
        >
          <label htmlFor="name-guess" className="sr-only">
            Votre idée de prénom
          </label>
          <input
            id="name-guess"
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Votre idée de prénom…"
            maxLength={40}
            disabled={feedback === "submitting"}
            className="min-h-11 flex-1 rounded-xl border border-[#e0d4f0] bg-white/90 px-4 text-base font-medium text-[#5c4f56] placeholder:text-[#b8a8b4] outline-none ring-[var(--color-floral-lavender)] focus:ring-2 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={guess.trim().length < 2 || feedback === "submitting"}
            className="min-h-11 shrink-0 rounded-xl bg-[var(--color-floral-lavender)] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {feedback === "submitting" ? "…" : "Tenter"}
          </button>
        </form>

        {feedback === "wrong" && (
          <p
            className="mt-3 animate-reveal text-center text-sm font-bold text-[var(--color-floral-rose)]"
            role="status"
          >
            Pas tout à fait… On verra bien ! 😉
          </p>
        )}
        {feedback === "correct" && (
          <p
            className="mt-3 animate-reveal text-center text-sm font-bold text-[var(--color-floral-sage-dark)]"
            role="status"
          >
            Bravo, vous avez trouvé ! 🎉
          </p>
        )}
      </div>
    </section>
  );
}

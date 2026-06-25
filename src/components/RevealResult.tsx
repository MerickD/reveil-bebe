"use client";

import { useEffect, useState } from "react";
import VoteFlowerBurst from "@/components/VoteFlowerBurst";
import RevealShare from "@/components/RevealShare";
import { getStoredVote, getStoredVoterName } from "@/lib/session";
import { getRevealEmoji } from "@/lib/reveal-share";
import type { VoteChoice } from "@/types/votes";

interface RevealResultProps {
  result: VoteChoice;
}

function CorrectVoteBadge({ result }: { result: VoteChoice }) {
  const [badge, setBadge] = useState<{
    show: boolean;
    name: string;
    correct: boolean;
  } | null>(null);

  useEffect(() => {
    const vote = getStoredVote();
    const name = getStoredVoterName().trim();

    if (!vote) {
      setBadge({ show: false, name: "", correct: false });
      return;
    }

    setBadge({
      show: true,
      name,
      correct: vote === result,
    });
  }, [result]);

  if (!badge?.show) return null;

  if (badge.correct) {
    return (
      <div
        className="relative mt-5 rounded-2xl bg-white/90 px-4 py-3 ring-2 ring-white/80"
        role="status"
      >
        <p className="text-sm font-bold text-[#5c4f56]">
          {badge.name ? (
            <>
              Bravo <span className="text-[var(--color-floral-sage-dark)]">{badge.name}</span>
              , vous aviez misé sur la bonne équipe ! {getRevealEmoji(result)}
            </>
          ) : (
            <>
              Bravo, vous aviez misé sur la bonne équipe ! {getRevealEmoji(result)}
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="relative mt-5 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-white/60">
      <p className="text-sm font-medium text-[#8a7d84]">
        Merci d&apos;avoir joué le jeu avec nous — le plus beau reste à venir !
      </p>
    </div>
  );
}

function NameSuggestionHint() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/name-suggestions")
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data) => setEnabled(data.enabled === true))
      .catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  return (
    <p className="relative mt-4 text-sm font-medium leading-relaxed text-[#6d5f66]">
      Le sexe est révélé — et le prénom&nbsp;? Proposez vos idées dans le
      formulaire un peu plus bas&nbsp;!
    </p>
  );
}

export default function RevealResult({ result }: RevealResultProps) {
  const [burstKey, setBurstKey] = useState(0);
  const isFille = result === "fille";

  useEffect(() => {
    setBurstKey((k) => k + 1);
  }, [result]);

  return (
    <>
      <VoteFlowerBurst choice={result} burstKey={burstKey} />
      <div
        className={`reveal-day-card animate-reveal relative overflow-hidden rounded-3xl px-6 py-7 text-center shadow-lg ring-2 sm:px-8 sm:py-8 ${
          isFille
            ? "bg-[var(--color-floral-rose-light)] ring-[var(--color-floral-rose-ring)]"
            : "bg-[var(--color-floral-sage-light)] ring-[var(--color-floral-sage-ring)]"
        }`}
      >
        <span className="pointer-events-none absolute -left-2 top-6 text-4xl opacity-30 animate-sway">
          ✨
        </span>
        <span className="pointer-events-none absolute right-4 top-4 text-3xl opacity-40">
          {isFille ? "🌸" : "🌿"}
        </span>
        <span className="pointer-events-none absolute bottom-4 left-6 text-2xl opacity-30 animate-sway">
          {isFille ? "💕" : "💚"}
        </span>

        <p className="relative mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#a890a0] ring-1 ring-white/60">
          <span>🎉</span> Jour J
        </p>
        <p className="relative text-sm font-semibold uppercase tracking-widest text-[#a890a0]">
          C&apos;est officiel…
        </p>

        <NameSuggestionHint />

        <CorrectVoteBadge result={result} />
        <RevealShare result={result} />
      </div>
    </>
  );
}

"use client";

import type { VoteChoice } from "@/types/votes";

interface RevealResultProps {
  result: VoteChoice;
}

export default function RevealResult({ result }: RevealResultProps) {
  const isFille = result === "fille";

  return (
    <div
      className={`animate-reveal relative overflow-hidden rounded-3xl p-8 text-center shadow-lg ring-2 ${
        isFille
          ? "bg-[var(--color-floral-rose-light)] ring-[var(--color-floral-rose-ring)]"
          : "bg-[var(--color-floral-sage-light)] ring-[var(--color-floral-sage-ring)]"
      }`}
    >
      <span className="pointer-events-none absolute right-4 top-4 text-2xl opacity-40">
        {isFille ? "🌸" : "🌿"}
      </span>
      <p className="relative mb-2 text-sm font-semibold uppercase tracking-widest text-[#a890a0]">
        🎉 C&apos;est officiel…
      </p>
      <p
        className={`relative text-4xl font-extrabold sm:text-5xl ${
          isFille
            ? "text-[var(--color-floral-rose)]"
            : "text-[var(--color-floral-sage)]"
        }`}
      >
        {isFille ? "C'est une Fille !" : "C'est un Garçon !"}
      </p>
      <p className="relative mt-4 font-medium text-[#8a7d84]">
        Merci d&apos;avoir partagé ce moment magique avec nous !
      </p>
    </div>
  );
}

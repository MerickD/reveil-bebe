"use client";

import { useCallback, useEffect, useState } from "react";

const BIRTH_LIST_URL = "https://www.minipouce.fr/orlanegarcianne";

export default function BirthListCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  const fetchEnabled = useCallback(async () => {
    try {
      const res = await fetch("/api/reveal");
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.birthListEnabled === true);
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

  if (enabled === null || !enabled) {
    return null;
  }

  return (
    <section
      className="glass-card relative overflow-hidden rounded-[1.75rem] p-5 text-center sm:p-7"
      aria-labelledby="birth-list-title"
    >
      <div className="pointer-events-none absolute -right-3 -top-3 text-2xl opacity-25">
        🎁
      </div>

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-floral-sage-light)] px-4 py-1 text-xs font-bold uppercase tracking-widest text-[var(--color-floral-sage-dark)] ring-1 ring-[var(--color-floral-sage-ring)]">
          <span>🧸</span> Liste de naissance
        </span>
        <h2
          id="birth-list-title"
          className="mt-3 text-xl font-extrabold text-[#5c4f56] sm:text-2xl"
        >
          Notre liste de naissance
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-[#8a7d84]">
          Si le cœur vous en dit, voici quelques idées pour préparer
          l&apos;arrivée de bébé avec nous.{" "}
          <span className="font-semibold text-[#5c4f56]">
            Il n&apos;y a absolument aucune obligation
          </span>{" "}
          — votre amour et votre présence comptent déjà énormément pour nous.
        </p>
        <a
          href={BIRTH_LIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-floral-sage)] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-105"
        >
          Voir la liste
          <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Countdown from "@/components/Countdown";
import VoteButtons from "@/components/VoteButtons";
import StatsDisplay from "@/components/StatsDisplay";
import RevealResult from "@/components/RevealResult";
import ShareButtons from "@/components/ShareButtons";
import type { VoteChoice } from "@/types/votes";

interface RevealState {
  isRevealed: boolean;
  revealDate: string;
  result: VoteChoice | null;
}

export default function HomeContent() {
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReveal = useCallback(async () => {
    try {
      const res = await fetch("/api/reveal");
      if (res.ok) {
        const data: RevealState = await res.json();
        setReveal(data);
        setError(null);
      } else {
        setError("Impossible de charger la configuration. Rechargez la page.");
      }
    } catch {
      const isLocal =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");
      setError(
        isLocal
          ? "Connexion au serveur impossible. Vérifiez que npm run dev est lancé."
          : "Connexion au serveur impossible. Réessayez dans quelques instants."
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReveal();
  }, [fetchReveal]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-floral-rose-light)] border-t-[var(--color-floral-rose)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-3xl p-6 text-center">
        <p className="font-semibold text-[var(--color-floral-rose)]">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchReveal();
          }}
          className="mt-4 rounded-xl bg-[var(--color-floral-rose-light)] px-5 py-2.5 text-sm font-bold text-[var(--color-floral-rose-dark)] ring-2 ring-[var(--color-floral-rose-ring)]"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!reveal?.revealDate) {
    return (
      <p className="text-center font-medium text-red-500">
        Configuration manquante : vérifiez les variables d&apos;environnement sur Vercel
        (NEXT_PUBLIC_REVEAL_DATE, Supabase…)
      </p>
    );
  }

  const showResult = Boolean(reveal.isRevealed && reveal.result);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="text-center">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#a890c0] shadow-sm ring-1 ring-[#e0d4f0]">
          <span className="text-base">🌸</span> Grande annonce
        </p>
        <h1 className="font-scratch text-4xl leading-none sm:text-5xl">
          <span className="text-[var(--color-title-rose)]">Fille</span>
          <span className="mx-1 text-[#d4c8cc]">ou</span>
          <span className="text-[var(--color-title-sage)]">Garçon</span>
          <span className="text-[#5c4f56]"> ?</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base font-medium leading-relaxed text-[#8a7d84]">
          C&apos;est nous,{" "}
          <span className="font-semibold text-[#5c4f56]">Orlane</span> et{" "}
          <span className="font-semibold text-[#5c4f56]">Mérick</span> ! Vous avez
          déjà eu la grande nouvelle&nbsp;: plutôt qu&apos;un gender reveal
          classique, on a préparé cette page pour partager l&apos;attente avec
          vous.
        </p>
        <p className="mx-auto mt-2 max-w-lg text-base font-medium leading-relaxed text-[#8a7d84]">
          Pour l&apos;instant, nous n&apos;en savons pas plus que vous. Pas de
          symptômes « révélateurs » à se mettre sous la dent, le suspense reste
          entier pour tout le monde. Alors… fille ou garçon, vous pariez sur quoi&nbsp;?
        </p>
      </header>

      {/* Vote en premier — élément principal */}
      {!showResult && <VoteButtons disabled={showResult} />}

      {showResult ? (
        <RevealResult result={reveal.result!} />
      ) : (
        <div className="glass-card rounded-3xl p-5 sm:p-6">
          <Countdown targetDate={reveal.revealDate} onComplete={fetchReveal} />
        </div>
      )}

      <StatsDisplay />
      <ShareButtons isRevealed={showResult} result={reveal.result} />
    </div>
  );
}

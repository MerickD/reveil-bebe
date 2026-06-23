"use client";

import { useEffect, useState } from "react";
import type { VoteChoice } from "@/types/votes";

interface ShareButtonsProps {
  isRevealed?: boolean;
  result?: VoteChoice | null;
}

function getShareUrl(): string {
  if (typeof window !== "undefined") return window.location.href;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

function getShareText(isRevealed: boolean, result?: VoteChoice | null): string {
  if (isRevealed && result) {
    const label = result === "fille" ? "une fille" : "un garçon";
    return `🎉 C'est ${label} ! Découvrez notre annonce :`;
  }
  return "👶 Fille ou Garçon ? Votez pour votre camp avant la grande révélation !";
}

export default function ShareButtons({
  isRevealed = false,
  result = null,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const text = getShareText(isRevealed, result);
  const url = getShareUrl();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard non disponible */
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: "Fille ou Garçon ?", text, url });
    } catch {
      /* annulé */
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

  const btnBase =
    "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-95 sm:flex-none";

  return (
    <div className="glass-card w-full rounded-3xl p-5">
      <h2 className="mb-4 text-center text-sm font-extrabold uppercase tracking-widest text-[#a890a0]">
        🌼 Inviter vos proches
      </h2>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center">
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className={`${btnBase} bg-[#f0eaf8] text-[#9078b0] ring-1 ring-[#e0d4f0] hover:bg-[#e8dff5]`}
          >
            📤 Partager
          </button>
        )}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} bg-[var(--color-floral-sage-light)] text-[var(--color-floral-sage-dark)] ring-2 ring-[var(--color-floral-sage-ring)] hover:bg-[var(--color-floral-sage-light)]/80`}
        >
          💬 WhatsApp
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className={`${btnBase} bg-white text-[#8a7d84] shadow-sm ring-1 ring-[#f0e8e4] hover:bg-[#faf6f0]`}
        >
          {copied ? "✓ Copié !" : "🔗 Copier le lien"}
        </button>
      </div>
    </div>
  );
}

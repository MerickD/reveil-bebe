"use client";

import { useCallback, useState } from "react";
import {
  buildShareMessage,
  buildWhatsAppUrl,
  getSiteUrl,
} from "@/lib/reveal-share";
import type { VoteChoice } from "@/types/votes";

interface RevealShareProps {
  result: VoteChoice;
}

export default function RevealShare({ result }: RevealShareProps) {
  const [copied, setCopied] = useState(false);

  const shareMessage = buildShareMessage(result, getSiteUrl());

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }, [shareMessage]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: shareMessage.split("\n")[0],
        text: shareMessage,
        url: getSiteUrl(),
      });
    } catch {
      /* annulé ou indisponible */
    }
  }, [shareMessage]);

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="mt-6 flex flex-col gap-3">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-[#a890c0]">
        Partager la nouvelle
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        <a
          href={buildWhatsAppUrl(shareMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-105"
        >
          <span aria-hidden>💬</span>
          WhatsApp
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/90 px-5 text-sm font-bold text-[#5c4f56] ring-2 ring-[#e0d4f0] transition hover:bg-white"
        >
          <span aria-hidden>{copied ? "✓" : "🔗"}</span>
          {copied ? "Copié !" : "Copier le message"}
        </button>
        {canNativeShare ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-floral-lavender)] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-105"
          >
            <span aria-hidden>📤</span>
            Partager
          </button>
        ) : null}
      </div>
    </div>
  );
}

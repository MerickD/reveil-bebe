import type { VoteChoice } from "@/types/votes";

export function getRevealHeadline(result: VoteChoice): string {
  return result === "fille" ? "C'est une fille !" : "C'est un garçon !";
}

export function getRevealEmoji(result: VoteChoice): string {
  return result === "fille" ? "🌸" : "🌿";
}

export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export function buildShareMessage(result: VoteChoice, siteUrl?: string): string {
  const url = siteUrl ?? getSiteUrl();
  const headline = getRevealHeadline(result);
  const emoji = getRevealEmoji(result);
  return `${headline} ${emoji}\nLa grande révélation d'Orlane & Mérick est là !\n${url}`;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

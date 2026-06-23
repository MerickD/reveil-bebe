"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionId, getStoredVoterName, storeVote, storeVoterName } from "@/lib/session";
import { formatRemainingTime, getRemainingEditMs, normalizeVoterName } from "@/lib/vote";
import VoteFlowerBurst from "@/components/VoteFlowerBurst";
import type { VoteChoice } from "@/types/votes";

interface VoteButtonsProps {
  onVoteSuccess?: (choice: VoteChoice) => void;
  disabled?: boolean;
}

interface VoteState {
  choice: VoteChoice;
  createdAt: string;
  canModify: boolean;
  remainingMs: number;
}

export default function VoteButtons({ onVoteSuccess, disabled }: VoteButtonsProps) {
  const [vote, setVote] = useState<VoteState | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState<VoteChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [burstChoice, setBurstChoice] = useState<VoteChoice>("fille");
  const [voterName, setVoterName] = useState("");

  const applyVoteState = useCallback((data: VoteState) => {
    setVote(data);
    storeVote(data.choice, data.createdAt);
  }, []);

  const fetchVote = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      const res = await fetch(
        `/api/vote?session_id=${encodeURIComponent(sessionId)}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.vote && data.createdAt) {
          applyVoteState({
            choice: data.vote,
            createdAt: data.createdAt,
            canModify: data.canModify,
            remainingMs: data.remainingMs,
          });
        } else {
          setVote(null);
        }
      }
    } catch {
      setError("Impossible de charger votre vote. Réessayez dans un instant.");
    } finally {
      setInitialLoading(false);
    }
  }, [applyVoteState]);

  useEffect(() => {
    setVoterName(getStoredVoterName());
    fetchVote();
  }, [fetchVote]);

  // Compte à rebours du délai de modification
  useEffect(() => {
    if (!vote?.canModify || !vote.createdAt) return;

    const tick = () => {
      const remaining = getRemainingEditMs(vote.createdAt);
      if (remaining <= 0) {
        setVote((v) => (v ? { ...v, canModify: false, remainingMs: 0 } : null));
      } else {
        setVote((v) => (v ? { ...v, remainingMs: remaining } : null));
      }
    };

    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [vote?.createdAt, vote?.canModify]);

  const handleVote = async (choice: VoteChoice) => {
    if (disabled || loading) return;
    if (vote && !vote.canModify) return;
    if (vote?.choice === choice) return;

    setLoading(choice);
    setError(null);

    const sessionId = getSessionId();
    const isUpdate = Boolean(vote);
    const normalizedName = normalizeVoterName(voterName);

    if (!isUpdate && !normalizedName) {
      setError("Indiquez votre prénom pour voter (2 caractères minimum).");
      setLoading(null);
      return;
    }

    const res = await fetch("/api/vote", {
      method: isUpdate ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        choice,
        ...(isUpdate ? {} : { voter_name: normalizedName }),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 409) {
        await fetchVote();
      } else {
        setError(data.error ?? "Impossible d'enregistrer votre vote.");
      }
      setLoading(null);
      return;
    }

    applyVoteState({
      choice: data.vote,
      createdAt: data.createdAt,
      canModify: data.canModify,
      remainingMs: data.remainingMs,
    });
    if (normalizedName) {
      storeVoterName(normalizedName);
    }
    setBurstChoice(data.vote);
    setBurstKey((k) => k + 1);
    setLoading(null);
    onVoteSuccess?.(data.vote);
  };

  const selected = vote?.choice ?? null;
  const canModify = vote?.canModify ?? false;
  const isLocked = Boolean(vote) && !canModify;
  const awaitingVote = !vote && !disabled && !initialLoading;
  const nameReady = Boolean(normalizeVoterName(voterName));
  const needsName = !vote;

  const filleDisabled =
    disabled || loading !== null || isLocked || selected === "fille" || (needsName && !nameReady);
  const garconDisabled =
    disabled || loading !== null || isLocked || selected === "garcon" || (needsName && !nameReady);

  if (initialLoading) {
    return (
      <section className="vote-hero glass-card flex min-h-[200px] items-center justify-center rounded-[1.75rem] p-5">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-floral-rose-light)] border-t-[var(--color-floral-rose)]" />
      </section>
    );
  }

  return (
    <>
      <VoteFlowerBurst choice={burstChoice} burstKey={burstKey} />
      <section
      className={`vote-hero glass-card relative overflow-hidden rounded-[1.75rem] p-5 sm:p-7 ${
        awaitingVote ? "animate-pulse-glow" : ""
      }`}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 text-3xl opacity-30">🌸</div>
      <div className="pointer-events-none absolute -bottom-2 -left-2 text-2xl opacity-30">🌿</div>

      <div className="relative">
        <div className="mb-5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-floral-rose-light)] px-4 py-1 text-xs font-bold uppercase tracking-widest text-[var(--color-floral-rose-dark)] ring-1 ring-[var(--color-floral-rose-ring)]">
            <span>🌷</span> {vote ? "Vote enregistré" : "À vous de jouer"}
          </span>
          <h2 className="mt-3 text-2xl font-extrabold text-[#5c4f56] sm:text-3xl">
            {selected ? (
              <>
                Vous êtes{" "}
                <span
                  className={
                    selected === "fille"
                      ? "text-[var(--color-floral-rose)]"
                      : "text-[var(--color-floral-sage)]"
                  }
                >
                  Team {selected === "fille" ? "Fille" : "Garçon"}
                </span>
              </>
            ) : (
              <span className="shimmer-text">Choisissez votre camp</span>
            )}
          </h2>

          {vote && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#6d5f66] ring-1 ring-[#f0e8e4]">
              <span className="text-[var(--color-floral-sage)]">✓</span>
              Vote comptabilisé
              {canModify && vote.remainingMs > 0 && (
                <span className="text-[var(--color-floral-rose-dark)]">
                  — modifiable encore {formatRemainingTime(vote.remainingMs)}
                </span>
              )}
              {isLocked && (
                <span className="text-[#a890a0]">— choix définitif</span>
              )}
            </p>
          )}

          {!vote && (
            <p className="mt-2 text-sm font-medium text-[#8a7d84]">
              Un seul vote — modifiable pendant 5 minutes
            </p>
          )}
        </div>

        {!vote && (
          <div className="mb-5">
            <label
              htmlFor="voter-name"
              className="mb-1.5 block text-center text-sm font-semibold text-[#6d5f66]"
            >
              Votre prénom
            </label>
            <input
              id="voter-name"
              type="text"
              value={voterName}
              onChange={(e) => {
                setVoterName(e.target.value);
                setError(null);
              }}
              placeholder="Ex. Marie"
              maxLength={40}
              autoComplete="name"
              className="w-full rounded-xl border border-[#f0e8e4] bg-white/90 px-4 py-3 text-center text-[#5c4f56] outline-none ring-[#e0d4f0] placeholder:text-[#c4b8bc] focus:border-[var(--color-floral-rose-ring)] focus:ring-2 focus:ring-[var(--color-floral-rose-light)]"
            />
            <p className="mt-1.5 text-center text-xs text-[#a890a0]">
              Pour nous seulement — pour savoir qui a voté
            </p>
          </div>
        )}

        <div className="flex items-stretch gap-3">
          <button
            type="button"
            onClick={() => handleVote("fille")}
            disabled={filleDisabled}
            className={`group relative flex flex-1 flex-col items-center gap-2 overflow-hidden rounded-2xl px-4 py-6 transition-all duration-300 ${
              selected === "fille"
                ? "bg-[var(--color-floral-rose)] text-white shadow-lg shadow-[var(--color-floral-rose-light)] scale-[1.02]"
                : filleDisabled
                  ? "bg-[var(--color-floral-rose-light)]/40 text-[var(--color-floral-rose-ring)] cursor-not-allowed opacity-50"
                  : "bg-[var(--color-floral-rose-light)] text-[var(--color-floral-rose-dark)] ring-2 ring-[var(--color-floral-rose-ring)] hover:bg-[var(--color-floral-rose)] hover:text-white hover:shadow-lg active:scale-95"
            } ${loading === "fille" ? "opacity-70" : ""}`}
          >
            <span className="text-3xl">🌸</span>
            <span className="font-scratch text-xl tracking-wide">Team Fille</span>
            {selected === "fille" && (
              <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                Votre choix ✓
              </span>
            )}
            {canModify && selected === "garcon" && (
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                Changer →
              </span>
            )}
          </button>

          <div className="flex flex-col items-center justify-center">
            <span className="rounded-full bg-[#f0eaf8] px-2.5 py-1 text-xs font-bold text-[#a890c0] ring-1 ring-[#e0d4f0]">
              ✿
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleVote("garcon")}
            disabled={garconDisabled}
            className={`group relative flex flex-1 flex-col items-center gap-2 overflow-hidden rounded-2xl px-4 py-6 transition-all duration-300 ${
              selected === "garcon"
                ? "bg-[var(--color-floral-sage)] text-white shadow-lg shadow-[var(--color-floral-sage-light)] scale-[1.02]"
                : garconDisabled
                  ? "bg-[var(--color-floral-sage-light)]/40 text-[var(--color-floral-sage-ring)] cursor-not-allowed opacity-50"
                  : "bg-[var(--color-floral-sage-light)] text-[var(--color-floral-sage-dark)] ring-2 ring-[var(--color-floral-sage-ring)] hover:bg-[var(--color-floral-sage)] hover:text-white hover:shadow-lg active:scale-95"
            } ${loading === "garcon" ? "opacity-70" : ""}`}
          >
            <span className="text-3xl">🌿</span>
            <span className="font-scratch text-xl tracking-wide">Team Garçon</span>
            {selected === "garcon" && (
              <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                Votre choix ✓
              </span>
            )}
            {canModify && selected === "fille" && (
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                Changer →
              </span>
            )}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm font-medium text-red-500">{error}</p>
        )}
      </div>
    </section>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeStats, type VoteStats } from "@/types/votes";

const EMPTY_STATS: VoteStats = {
  fille: 0,
  garcon: 0,
  total: 0,
  fillePercent: 50,
  garconPercent: 50,
};

export default function StatsDisplay() {
  const [stats, setStats] = useState<VoteStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchVotes() {
      const { data, error } = await supabase.from("votes").select("choice");
      if (!error && data) {
        setStats(computeStats(data));
      }
      setLoading(false);
    }

    fetchVotes();

    const channel = supabase
      .channel("votes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => fetchVotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="glass-card w-full rounded-3xl p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-[#5c4f56]">
          🌼 Tendance live
        </h2>
        <span className="rounded-full bg-[#f0eaf8] px-3 py-1 text-xs font-semibold text-[#a890c0] ring-1 ring-[#e0d4f0]">
          {loading ? "…" : `${stats.total} vote${stats.total !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="mb-5 flex h-10 overflow-hidden rounded-2xl shadow-inner ring-1 ring-gray-100">
        <div
          className="flex items-center justify-center bg-[var(--color-floral-rose)] text-sm font-bold text-white transition-all duration-700 ease-out"
          style={{ width: `${stats.fillePercent}%`, minWidth: stats.fillePercent > 0 ? "2rem" : 0 }}
        >
          {stats.fillePercent > 12 && `${stats.fillePercent}%`}
        </div>
        <div
          className="flex items-center justify-center bg-[var(--color-floral-sage)] text-sm font-bold text-white transition-all duration-700 ease-out"
          style={{ width: `${stats.garconPercent}%`, minWidth: stats.garconPercent > 0 ? "2rem" : 0 }}
        >
          {stats.garconPercent > 12 && `${stats.garconPercent}%`}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[var(--color-floral-rose-light)] p-3 text-center ring-2 ring-[var(--color-floral-rose-ring)]">
          <p className="text-2xl font-extrabold text-[var(--color-floral-rose)]">{stats.fillePercent}%</p>
          <p className="text-xs font-bold text-[var(--color-floral-rose-dark)]">🌸 Team Fille</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-floral-sage-light)] p-3 text-center ring-2 ring-[var(--color-floral-sage-ring)]">
          <p className="text-2xl font-extrabold text-[var(--color-floral-sage)]">{stats.garconPercent}%</p>
          <p className="text-xs font-bold text-[var(--color-floral-sage-dark)]">🌿 Team Garçon</p>
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-[#a890a0]">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-floral-sage)]" />
        Mise à jour en temps réel
      </p>
    </div>
  );
}

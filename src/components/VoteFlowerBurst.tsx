"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { VoteChoice } from "@/types/votes";

const EMOJIS: Record<VoteChoice, string[]> = {
  fille: ["👧", "🍼", "💗", "💕", "🩷"],
  garcon: ["👦", "🍼", "💚"],
};

const PARTICLE_COUNT = 32;
const BURST_DURATION_MS = 8000;

interface Particle {
  id: string;
  emoji: string;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  peakOpacity: number;
}

interface VoteFlowerBurstProps {
  choice: VoteChoice;
  burstKey: number;
}

function createParticles(choice: VoteChoice, burstKey: number): Particle[] {
  const emojis = EMOJIS[choice];
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: `${burstKey}-${i}`,
    emoji: emojis[i % emojis.length]!,
    left: 8 + Math.random() * 84,
    top: 15 + Math.random() * 75,
    size: 0.75 + Math.random() * 0.9,
    delay: Math.random() * 1400,
    duration: 4.5 + Math.random() * 2,
    driftX: (Math.random() - 0.5) * 50,
    driftY: -50 - Math.random() * 70,
    peakOpacity: 0.55 + Math.random() * 0.35,
  }));
}

export default function VoteFlowerBurst({ choice, burstKey }: VoteFlowerBurstProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const particles = useMemo(
    () => (burstKey > 0 ? createParticles(choice, burstKey) : []),
    [choice, burstKey]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (burstKey === 0) return;
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), BURST_DURATION_MS);
    return () => clearTimeout(hide);
  }, [burstKey, choice]);

  if (!mounted || !visible || particles.length === 0) return null;

  return createPortal(
    <div
      className="vote-burst-overlay pointer-events-none fixed inset-0 z-[200] overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="vote-burst-particle absolute select-none"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              fontSize: `${p.size}rem`,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.duration}s`,
              "--drift-x": `${p.driftX}px`,
              "--drift-y": `${p.driftY}px`,
              "--peak-opacity": p.peakOpacity,
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>,
    document.body
  );
}

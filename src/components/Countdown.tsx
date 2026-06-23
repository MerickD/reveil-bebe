"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownProps {
  targetDate: string;
  onComplete?: () => void;
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const difference = new Date(targetDate).getTime() - Date.now();
  if (difference <= 0) return null;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-center rounded-2xl bg-white/80 py-3 shadow-sm ring-1 ring-[#f0e8e4] sm:py-4">
        <span className="text-2xl font-extrabold tabular-nums text-[#6d5f66] sm:text-3xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#b0a0a8] sm:text-xs">
        {label}
      </span>
    </div>
  );
}

export default function Countdown({ targetDate, onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calculateTimeLeft(targetDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(targetDate);
      setTimeLeft(remaining);
      if (!remaining) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (!timeLeft) return null;

  return (
    <div className="w-full">
      <p className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-[#a890c0]">
        🌷 Révélation dans
      </p>
      <div className="flex gap-2 sm:gap-3">
        <TimeBlock value={timeLeft.days} label="Jours" />
        <TimeBlock value={timeLeft.hours} label="Heures" />
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <TimeBlock value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
}

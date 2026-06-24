"use client";

import { getLetterIndices } from "@/lib/mystery-name-utils";
import type { VoteChoice } from "@/types/votes";

interface AdminLetterPickerProps {
  name: string;
  label: string;
  emoji: string;
  accent: VoteChoice;
  indices: number[];
  onChange: (indices: number[]) => void;
}

function isLetter(char: string): boolean {
  return /[A-Za-zÀ-ÿ]/.test(char);
}

export default function AdminLetterPicker({
  name,
  label,
  emoji,
  accent,
  indices,
  onChange,
}: AdminLetterPickerProps) {
  const accentRing =
    accent === "fille" ? "ring-[#f48fb1]" : "ring-[#81c784]";
  const accentActive =
    accent === "fille"
      ? "bg-[var(--color-floral-rose-light)] text-[var(--color-floral-rose-dark)]"
      : "bg-[var(--color-floral-sage-light)] text-[var(--color-floral-sage-dark)]";
  const accentText =
    accent === "fille"
      ? "text-[var(--color-floral-rose-dark)]"
      : "text-[var(--color-floral-sage-dark)]";

  const toggle = (index: number) => {
    if (indices.includes(index)) {
      onChange(indices.filter((i) => i !== index));
    } else {
      onChange([...indices, index].sort((a, b) => a - b));
    }
  };

  const revealAll = () => onChange(getLetterIndices(name));
  const hideAll = () => onChange([]);

  return (
    <div className="rounded-2xl border border-[#e0d4f0] bg-white/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm font-bold ${accentText}`}>
          <span className="mr-1">{emoji}</span>
          {label}
        </p>
        <p className="text-xs font-medium text-[#8a7d84]">
          {indices.length} / {getLetterIndices(name).length} visibles
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {name.split("").map((char, index) => {
          if (!isLetter(char)) {
            return (
              <span
                key={`${label}-sep-${index}`}
                className="px-0.5 text-sm font-bold text-[#c4b0d8]"
              >
                {char}
              </span>
            );
          }

          const revealed = indices.includes(index);
          return (
            <button
              key={`${label}-letter-${index}`}
              type="button"
              onClick={() => toggle(index)}
              title={
                revealed
                  ? "Visible sur le site — cliquer pour masquer"
                  : "Masquée — cliquer pour révéler"
              }
              className={`flex h-10 w-9 items-center justify-center rounded-xl text-sm font-extrabold ring-2 transition active:scale-95 sm:h-11 sm:w-10 ${
                revealed
                  ? `${accentActive} ${accentRing}`
                  : "bg-[var(--color-floral-lavender-light)] text-[#a890c0] ring-[#d8cce8]"
              }`}
            >
              {char.toLocaleUpperCase("fr-FR")}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={hideAll}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#8a7d84] ring-1 ring-[#e0d4f0] hover:bg-[#faf6f0]"
        >
          Tout masquer
        </button>
        <button
          type="button"
          onClick={revealAll}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#8a7d84] ring-1 ring-[#e0d4f0] hover:bg-[#faf6f0]"
        >
          Tout révéler
        </button>
      </div>
    </div>
  );
}

export type RevealedLettersState = import("@/lib/mystery-name-types").RevealedLettersState;

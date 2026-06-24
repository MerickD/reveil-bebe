export function isLetter(char: string): boolean {
  return /[A-Za-zÀ-ÿ]/.test(char);
}

export function getLetterIndices(name: string): number[] {
  const indices: number[] = [];
  for (let i = 0; i < name.length; i++) {
    if (isLetter(name[i])) indices.push(i);
  }
  return indices;
}

export function parseRevealedIndices(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is number => typeof item === "number" && Number.isInteger(item))
    .filter((item) => item >= 0);
}

export function sanitizeRevealedIndices(
  name: string,
  indices: number[]
): number[] {
  const valid = new Set(getLetterIndices(name));
  return [...new Set(indices.filter((i) => valid.has(i)))].sort((a, b) => a - b);
}

export function computeMaskedNameFromIndices(
  babyName: string,
  revealedIndices: number[]
) {
  const trimmed = babyName.trim();
  const letterIndices = getLetterIndices(trimmed);
  const totalLetters = letterIndices.length;
  const revealedSet = new Set(sanitizeRevealedIndices(trimmed, revealedIndices));
  const slots = [];

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (char === " ") {
      slots.push({ type: "space" as const, value: " ", isRevealed: true, index: i });
      continue;
    }

    if (!isLetter(char)) {
      slots.push({
        type: "separator" as const,
        value: char,
        isRevealed: true,
        index: i,
      });
      continue;
    }

    const revealed = revealedSet.has(i);
    slots.push({
      type: "letter" as const,
      value: revealed ? char.toLocaleUpperCase("fr-FR") : "?",
      isRevealed: revealed,
      index: i,
    });
  }

  const revealedCount = letterIndices.filter((i) => revealedSet.has(i)).length;

  return {
    slots,
    revealedCount,
    totalLetters,
    isFullyRevealed: totalLetters > 0 && revealedCount === totalLetters,
  };
}

export function normalizeGuess(guess: string): string {
  return guess
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z]/g, "");
}

export function normalizeBabyName(name: string): string {
  return normalizeGuess(name);
}

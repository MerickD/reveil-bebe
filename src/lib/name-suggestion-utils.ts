export function normalizeSuggestedName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) return null;
  if (!/^[\p{L}\s'-]+$/u.test(name)) return null;

  return name;
}

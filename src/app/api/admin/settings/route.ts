import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getMysteryNameConfig,
  parseRevealedIndices,
  sanitizeRevealedIndices,
  updateRevealedLetters,
} from "@/lib/mystery-name";
import { getRevealConfig, updateRevealConfig } from "@/lib/reveal";
import type { VoteChoice } from "@/types/votes";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const config = await getRevealConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Configuration introuvable" },
      { status: 404 }
    );
  }

  const mystery = await getMysteryNameConfig();

  return NextResponse.json({
    revealDate: config.revealDate,
    result: config.result,
    nameGameEnabled: config.nameGameEnabled,
    nameSuggestionsEnabled: config.nameSuggestionsEnabled,
    nameGameWinnerOnly: mystery?.winnerOnly ?? false,
    source: config.source,
    names: mystery?.names ?? null,
    revealedLetters: mystery?.revealedLetters ?? { fille: [], garcon: [] },
  });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const {
    revealDate,
    result,
    nameGameEnabled,
    nameSuggestionsEnabled,
    nameGameWinnerOnly,
    revealedLetters,
  } = body;

  if (!revealDate || isNaN(new Date(revealDate).getTime())) {
    return NextResponse.json(
      { error: "Date de révélation invalide" },
      { status: 400 }
    );
  }

  if (result !== null && result !== "fille" && result !== "garcon") {
    return NextResponse.json(
      { error: "Résultat invalide (fille, garcon ou null)" },
      { status: 400 }
    );
  }

  if (nameGameEnabled !== undefined && typeof nameGameEnabled !== "boolean") {
    return NextResponse.json(
      { error: "nameGameEnabled doit être un booléen" },
      { status: 400 }
    );
  }

  if (
    nameSuggestionsEnabled !== undefined &&
    typeof nameSuggestionsEnabled !== "boolean"
  ) {
    return NextResponse.json(
      { error: "nameSuggestionsEnabled doit être un booléen" },
      { status: 400 }
    );
  }

  if (nameGameWinnerOnly !== undefined && typeof nameGameWinnerOnly !== "boolean") {
    return NextResponse.json(
      { error: "nameGameWinnerOnly doit être un booléen" },
      { status: 400 }
    );
  }

  const update = await updateRevealConfig(revealDate, result as VoteChoice | null, {
    nameGameEnabled,
    nameSuggestionsEnabled,
  });

  if (!update.ok) {
    return NextResponse.json({ error: update.error }, { status: 500 });
  }

  if (revealedLetters !== undefined || nameGameWinnerOnly !== undefined) {
    const mystery = await getMysteryNameConfig();
    if (!mystery) {
      return NextResponse.json(
        { error: "Prénoms non configurés (BABY_NAME_FILLE / BABY_NAME_GARCON)" },
        { status: 400 }
      );
    }

    const fille = parseRevealedIndices(revealedLetters?.fille ?? mystery.revealedLetters.fille);
    const garcon = parseRevealedIndices(revealedLetters?.garcon ?? mystery.revealedLetters.garcon);

    const lettersUpdate = await updateRevealedLetters(
      {
        fille: sanitizeRevealedIndices(mystery.names.fille, fille),
        garcon: sanitizeRevealedIndices(mystery.names.garcon, garcon),
      },
      typeof nameGameWinnerOnly === "boolean" ? nameGameWinnerOnly : mystery.winnerOnly
    );

    if (!lettersUpdate.ok) {
      return NextResponse.json({ error: lettersUpdate.error }, { status: 500 });
    }

    if (lettersUpdate.warning) {
      return NextResponse.json({ ok: true, warning: lettersUpdate.warning });
    }
  }

  if (update.warning) {
    return NextResponse.json({ ok: true, warning: update.warning });
  }

  return NextResponse.json({ ok: true });
}

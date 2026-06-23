import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
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

  return NextResponse.json({
    revealDate: config.revealDate,
    result: config.result,
    source: config.source,
  });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { revealDate, result } = body;

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

  const update = await updateRevealConfig(
    revealDate,
    result as VoteChoice | null
  );

  if (!update.ok) {
    return NextResponse.json({ error: update.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getRevealState } from "@/lib/reveal";

export async function GET() {
  const state = await getRevealState();

  if (!state) {
    return NextResponse.json(
      { error: "Configuration de révélation manquante" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    isRevealed: state.isRevealed,
    revealDate: state.revealDate,
    result: state.isRevealed ? state.result : null,
  });
}

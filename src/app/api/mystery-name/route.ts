import { NextResponse } from "next/server";
import {
  checkNameGuess,
  getMaskedNameState,
} from "@/lib/mystery-name";

export async function GET() {
  const state = await getMaskedNameState();

  if (!state.enabled) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json(state);
}

export async function POST(request: Request) {
  let body: { guess?: string; session_id?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const guess = typeof body.guess === "string" ? body.guess : "";
  if (guess.trim().length < 2) {
    return NextResponse.json(
      { error: "Indiquez un prénom d'au moins 2 caractères." },
      { status: 400 }
    );
  }

  const sessionId =
    typeof body.session_id === "string" ? body.session_id : undefined;

  const result = await checkNameGuess(guess, { sessionId });

  if (result.feedback === "disabled") {
    return NextResponse.json({ enabled: false }, { status: 404 });
  }

  return NextResponse.json({
    feedback: result.feedback,
    saved: result.saved,
  });
}

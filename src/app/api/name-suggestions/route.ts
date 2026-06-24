import { NextResponse } from "next/server";
import { saveNameSuggestion } from "@/lib/name-suggestions-store";
import { getRevealConfig } from "@/lib/reveal";

export async function GET() {
  const config = await getRevealConfig();
  if (!config?.nameSuggestionsEnabled) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({ enabled: true });
}

export async function POST(request: Request) {
  const config = await getRevealConfig();
  if (!config?.nameSuggestionsEnabled) {
    return NextResponse.json({ enabled: false }, { status: 404 });
  }

  let body: {
    suggested_name?: string;
    proposer_name?: string;
    session_id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const sessionId =
    typeof body.session_id === "string" ? body.session_id : undefined;

  const result = await saveNameSuggestion({
    suggestedName: body.suggested_name ?? "",
    proposerName: body.proposer_name ?? "",
    sessionId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Impossible d'enregistrer la proposition" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, saved: true });
}

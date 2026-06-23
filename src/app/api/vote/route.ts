import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import {
  canModifyVote,
  getRemainingEditMs,
  VOTE_EDIT_WINDOW_MS,
} from "@/lib/vote";
import type { VoteChoice } from "@/types/votes";

function isValidChoice(choice: unknown): choice is VoteChoice {
  return choice === "fille" || choice === "garcon";
}

function buildVoteResponse(choice: VoteChoice, createdAt: string) {
  const canModify = canModifyVote(createdAt);
  return {
    vote: choice,
    createdAt,
    canModify,
    remainingMs: getRemainingEditMs(createdAt),
    editWindowMs: VOTE_EDIT_WINDOW_MS,
  };
}

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id requis" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("votes")
    .select("choice, created_at")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ vote: null });
  }

  return NextResponse.json(
    buildVoteResponse(data.choice as VoteChoice, data.created_at)
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const { session_id: sessionId, choice } = body;

  if (!sessionId || !isValidChoice(choice)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("votes")
    .insert({ session_id: sessionId, choice })
    .select("choice, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Un vote existe déjà pour cette session" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    buildVoteResponse(data.choice as VoteChoice, data.created_at)
  );
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { session_id: sessionId, choice } = body;

  if (!sessionId || !isValidChoice(choice)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const supabase = createServiceClient() ?? createServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("votes")
    .select("choice, created_at")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Vote introuvable" }, { status: 404 });
  }

  if (!canModifyVote(existing.created_at)) {
    return NextResponse.json(
      { error: "Le délai de modification est expiré" },
      { status: 403 }
    );
  }

  if (existing.choice === choice) {
    return NextResponse.json(
      buildVoteResponse(existing.choice as VoteChoice, existing.created_at)
    );
  }

  const { data, error } = await supabase
    .from("votes")
    .update({ choice })
    .eq("session_id", sessionId)
    .select("choice, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    buildVoteResponse(data.choice as VoteChoice, data.created_at)
  );
}

import { NextResponse } from "next/server";
import { subscribeToNotifications } from "@/lib/notifications-store";
import { getRevealConfig } from "@/lib/reveal";

export async function GET() {
  const config = await getRevealConfig();
  if (!config?.notificationsEnabled) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({ enabled: true });
}

export async function POST(request: Request) {
  const config = await getRevealConfig();
  if (!config?.notificationsEnabled) {
    return NextResponse.json({ enabled: false }, { status: 404 });
  }

  let body: {
    email?: string;
    first_name?: string;
    session_id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const result = await subscribeToNotifications({
    email: body.email ?? "",
    firstName: body.first_name,
    sessionId: typeof body.session_id === "string" ? body.session_id : undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Impossible d'enregistrer l'inscription" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    alreadySubscribed: result.alreadySubscribed === true,
  });
}

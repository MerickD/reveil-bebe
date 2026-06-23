import { NextResponse } from "next/server";
import {
  isAdminAuthenticated,
  isAdminEnabled,
  setAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json(
      { error: "Page admin désactivée (ADMIN_PASSWORD non définie)" },
      { status: 503 }
    );
  }

  const { password } = await request.json();

  if (!password || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (!isAdminEnabled()) {
    return NextResponse.json({ authenticated: false, enabled: false });
  }

  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({ authenticated, enabled: true });
}

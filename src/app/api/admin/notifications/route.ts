import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isEmailConfigured, sendUpdateEmails } from "@/lib/email";
import {
  listActiveSubscribers,
  listSubscribersForAdmin,
} from "@/lib/notifications-store";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const subscribers = await listSubscribersForAdmin();
  return NextResponse.json({
    subscribers,
    count: subscribers.length,
    emailConfigured: isEmailConfigured(),
  });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { subject?: string; message?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (subject.length < 3 || subject.length > 120) {
    return NextResponse.json(
      { error: "Objet : entre 3 et 120 caractères" },
      { status: 400 }
    );
  }

  if (message.length < 10 || message.length > 2000) {
    return NextResponse.json(
      { error: "Message : entre 10 et 2000 caractères" },
      { status: 400 }
    );
  }

  const recipients = await listActiveSubscribers();
  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "Aucun abonné actif pour le moment" },
      { status: 400 }
    );
  }

  const result = await sendUpdateEmails({
    subject,
    message,
    recipients: recipients.map((r) => ({
      email: r.email,
      firstName: r.firstName,
      unsubscribeToken: r.unsubscribeToken,
    })),
  });

  if (!result.ok && result.sent === 0) {
    return NextResponse.json(
      { error: result.error ?? "Envoi impossible" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    failed: result.failed,
    warning: result.error,
  });
}

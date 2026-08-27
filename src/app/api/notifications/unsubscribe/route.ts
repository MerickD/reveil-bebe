import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/notifications-store";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const result = await unsubscribeByToken(token);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  if (!result.ok) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Désabonnement</title></head>
      <body style="font-family:system-ui;padding:2rem;color:#5c4f56">
        <h1>Lien invalide</h1>
        <p>${result.error ?? "Impossible de traiter la demande."}</p>
        <p><a href="${siteUrl}">Retour au site</a></p>
      </body></html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(
    `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Désabonnement</title></head>
    <body style="font-family:system-ui;padding:2rem;color:#5c4f56">
      <h1>C'est noté</h1>
      <p>Vous ne recevrez plus nos mises à jour par email.</p>
      <p><a href="${siteUrl}">Retour au site</a></p>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

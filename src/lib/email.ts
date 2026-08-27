import "server-only";
import { Resend } from "resend";

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function getFromAddress(): string | null {
  return process.env.RESEND_FROM_EMAIL?.trim() || null;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && getFromAddress());
}

export async function sendUpdateEmails(input: {
  subject: string;
  message: string;
  recipients: { email: string; firstName: string | null; unsubscribeToken: string }[];
}): Promise<{
  ok: boolean;
  sent: number;
  failed: number;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getFromAddress();

  if (!apiKey || !from) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      error:
        "Configurez RESEND_API_KEY et RESEND_FROM_EMAIL (ex. Orlane & Mérick <onboarding@resend.dev>)",
    };
  }

  const resend = new Resend(apiKey);
  const siteUrl = getSiteUrl();
  let sent = 0;
  let failed = 0;

  for (const recipient of input.recipients) {
    const greeting = recipient.firstName
      ? `Bonjour ${recipient.firstName},`
      : "Bonjour,";
    const unsubscribeUrl = `${siteUrl}/api/notifications/unsubscribe?token=${encodeURIComponent(recipient.unsubscribeToken)}`;

    const text = `${greeting}

${input.message}

→ Voir le site : ${siteUrl}

—
Orlane & Mérick
Pour ne plus recevoir ces messages : ${unsubscribeUrl}`;

    const html = `
      <div style="font-family: system-ui, sans-serif; color: #5c4f56; line-height: 1.6; max-width: 560px;">
        <p>${greeting}</p>
        <p style="white-space: pre-wrap;">${input.message
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br />")}</p>
        <p style="margin-top: 24px;">
          <a href="${siteUrl}" style="display:inline-block;background:#c4b0d8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700;">
            Voir le site
          </a>
        </p>
        <p style="margin-top: 32px; font-size: 12px; color: #a890c0;">
          Orlane &amp; Mérick<br />
          <a href="${unsubscribeUrl}" style="color:#a890c0;">Se désabonner</a>
        </p>
      </div>
    `;

    try {
      const { error } = await resend.emails.send({
        from,
        to: recipient.email,
        subject: input.subject,
        text,
        html,
      });

      if (error) {
        failed += 1;
      } else {
        sent += 1;
      }
    } catch {
      failed += 1;
    }

    // Évite de saturer l'API Resend en envoi groupé
    await new Promise((r) => setTimeout(r, 120));
  }

  return {
    ok: failed === 0,
    sent,
    failed,
    error:
      failed > 0
        ? `${failed} envoi(s) ont échoué (${sent} réussi(s)).`
        : undefined,
  };
}

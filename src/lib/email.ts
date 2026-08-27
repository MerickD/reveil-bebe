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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(input: {
  greeting: string;
  message: string;
  siteUrl: string;
  unsubscribeUrl: string;
}): string {
  const messageHtml = escapeHtml(input.message).replace(/\n/g, "<br />");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orlane &amp; Mérick</title>
</head>
<body style="margin:0;padding:0;background-color:#faf6f0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#faf6f0;background-image:linear-gradient(160deg,#ffc8dd 0%,#faf6f0 42%,#c8e6c9 100%);padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <span style="display:inline-block;background:#ffffff;border:1px solid #e0d4f0;border-radius:999px;padding:8px 16px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a890c0;">
                🌸 Orlane &amp; Mérick
              </span>
            </td>
          </tr>
          <tr>
            <td style="background:#fffcf8;border:1px solid rgba(224,86,122,0.18);border-radius:24px;padding:32px 28px;box-shadow:0 8px 28px rgba(82,163,82,0.08);">
              <p style="margin:0 0 8px;text-align:center;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#a890c0;">
                💌 Une petite nouvelle
              </p>
              <p style="margin:0 0 18px;text-align:center;font-size:22px;font-weight:800;line-height:1.25;color:#5c4f56;">
                ${escapeHtml(input.greeting)}
              </p>
              <p style="margin:0;font-size:16px;line-height:1.65;color:#8a7d84;text-align:center;">
                ${messageHtml}
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="${input.siteUrl}" style="display:inline-block;background:#c4b0d8;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:14px;font-size:14px;font-weight:700;">
                      Voir le site →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;text-align:center;font-size:22px;line-height:1;">
                🌸&nbsp;&nbsp;🌿&nbsp;&nbsp;🍼
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:22px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#a890c0;">
                Avec toute notre affection,<br />
                <strong style="color:#5c4f56;">Orlane &amp; Mérick</strong>
              </p>
              <p style="margin:14px 0 0;font-size:11px;line-height:1.5;color:#b8a8b4;">
                <a href="${input.unsubscribeUrl}" style="color:#a890c0;text-decoration:underline;">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

    const html = buildEmailHtml({
      greeting,
      message: input.message,
      siteUrl,
      unsubscribeUrl,
    });

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

import { Resend } from "resend";

export type SendEmailResult = { ok: boolean; error?: string; skipped?: boolean };

/**
 * Send a transactional email via Resend.
 *
 * Returns a result instead of throwing — a failed email must NEVER fail the
 * submission/flow that triggered it. But failures are now LOUD: every skip or
 * error is logged with the intended recipient + subject so they show up in
 * Vercel runtime logs (the July stress test lost ~6 emails silently because
 * this used to `return` / `console.warn` with no context and no result).
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.error(
      `[email] SKIPPED (RESEND_API_KEY not set) — to="${to}" subject="${subject}"`
    );
    return { ok: false, skipped: true, error: "RESEND_API_KEY not set" };
  }

  // Lazy instantiation — only created when the key exists at call time
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      // Sender must be on a domain verified in Resend. Override via RESEND_FROM
      // if you'd rather send from e.g. hello@talkinflag.com.
      from: process.env.RESEND_FROM || "Talkin Flag <noreply@talkinflag.com>",
      to,
      subject,
      html,
      ...(replyTo && { replyTo }),
    });

    if (error) {
      console.error(
        `[email] SEND FAILED — to="${to}" subject="${subject}" error="${error.message}"`
      );
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[email] SEND THREW — to="${to}" subject="${subject}" error="${message}"`
    );
    return { ok: false, error: message };
  }
}

/**
 * Shared branded wrapper for submitter-facing confirmation emails
 * ("we got it, an admin will review"). Mirrors the welcome-email tone.
 */
export function confirmationEmailHtml({
  heading,
  body,
}: {
  heading: string;
  body: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <tr><td>
      <p style="font-family:Georgia,serif;font-size:28px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#FDDD58;margin:0 0 8px;">TALKIN FLAG</p>
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ffffff60;margin:0 0 32px;">The Global Flag Football Hub</p>
      <p style="font-size:18px;line-height:1.5;color:#ffffff;margin:0 0 16px;font-weight:bold;">${heading}</p>
      <p style="font-size:15px;line-height:1.6;color:#ffffffcc;margin:0 0 32px;">${body}</p>
      <p style="font-size:12px;color:#ffffff30;margin:32px 0 0;line-height:1.6;">
        <a href="https://talkinflag.com" style="color:#FDDD5860;text-decoration:none;">talkinflag.com</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

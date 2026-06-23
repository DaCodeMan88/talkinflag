import { Resend } from "resend";

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
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return;
  }

  // Lazy instantiation — only created when the key exists at call time
  const resend = new Resend(process.env.RESEND_API_KEY);

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
    console.error("Email send error:", error.message);
  }
}

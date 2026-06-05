import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const { error } = await resend.emails.send({
    from: "Talkin Flag <noreply@talkinflag.vercel.app>",
    to,
    subject,
    html,
    ...(replyTo && { replyTo }),
  });

  if (error) {
    console.error("Email send error:", error.message);
  }
}

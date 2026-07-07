import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendEmail, confirmationEmailHtml } from "@/lib/email";
import { rateLimit, getClientIp, retryAfterSeconds } from "@/lib/rate-limit";

const VALID_SUBJECTS = [
  "Podcast Feature",
  "Player Submission",
  "Partnership / Sponsorship",
  "Press",
  "Other",
];

// Escape user input before it's interpolated into the notification email HTML.
// Output to the public site is already escaped by React; this protects the
// admin inbox from HTML/style injection via the contact form.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success, reset } = rateLimit(`contact:${ip}`, {
      limit: 5,
      windowMs: 60_000,
    });
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds(reset)) } }
      );
    }

    const body = await req.json();

    // Honeypot: real users never fill this hidden field. Pretend success so we
    // don't tip off the bot, but skip the DB write + email.
    if (typeof body?.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true });
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!body.message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const subject = VALID_SUBJECTS.includes(body.subject) ? body.subject : "Other";
    const name = body.name.trim().slice(0, 200);
    const email = body.email.trim().slice(0, 200);
    const message = body.message.trim().slice(0, 2000);

    const supabase = createServerClient();
    const { error } = await supabase.from("contact_submissions").insert({
      name, email, subject, message,
    });

    if (error) {
      console.error("Contact submission error:", error.message);
      return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
    }

    const to = process.env.CONTACT_EMAIL_TO;
    if (to) {
      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safeSubject = escapeHtml(subject);
      const safeMessage = escapeHtml(message);
      await sendEmail({
        to,
        subject: `[Talkin Flag] ${subject} from ${name}`,
        replyTo: email,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#FDDD58;font-family:sans-serif">${safeSubject}</h2>
            <p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
            <hr style="border:1px solid #222;margin:16px 0"/>
            <p style="white-space:pre-wrap;color:#333">${safeMessage}</p>
            <hr style="border:1px solid #222;margin:16px 0"/>
            <p style="color:#999;font-size:12px">Talkin Flag contact form</p>
          </div>
        `,
      });
    }

    // Submitter confirmation — "we got it". Never blocks the submission.
    await sendEmail({
      to: email,
      subject: "We got your message — Talkin Flag",
      html: confirmationEmailHtml({
        heading: "Thanks for reaching out 🏈",
        body: `We received your message${
          subject ? ` about “${escapeHtml(subject)}”` : ""
        } and someone from the Talkin Flag team will get back to you soon.`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

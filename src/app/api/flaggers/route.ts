import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendEmail, confirmationEmailHtml } from "@/lib/email";
import { rateLimit, getClientIp, retryAfterSeconds } from "@/lib/rate-limit";
import { validateFlaggerApplication, formatApplication } from "@/lib/flagger-application";

// Flagger applications reuse contact_submissions (subject "Flagger Application")
// so no new table is needed until real applicants exist. The full application is
// in `message` as one "key: value" line per field, including the computed status.
const FLAGGER_SUBJECT = "Flagger Application";

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
    const { success, reset } = rateLimit(`flaggers:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds(reset)) } }
      );
    }

    const result = validateFlaggerApplication(await req.json(), Date.now());

    // Bots get the same success response as people, so the form is no oracle.
    if (!result.ok && result.drop) return NextResponse.json({ success: true });
    if (!result.ok) {
      return NextResponse.json({ error: "Please check the highlighted fields.", fields: result.errors }, { status: 400 });
    }

    const row = result.row;
    const message = formatApplication(row);

    const supabase = createServerClient();
    const { error } = await supabase.from("contact_submissions").insert({
      name: row.name,
      email: row.email,
      subject: FLAGGER_SUBJECT,
      message,
    });
    if (error) {
      console.error("Flagger application error:", error.message);
      return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }

    const to = process.env.CONTACT_EMAIL_TO;
    if (to) {
      await sendEmail({
        to,
        subject: `[Talkin Flag] Flagger application from ${row.name} (${row.status})`,
        replyTo: row.email,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="font-family:sans-serif">Flagger application</h2>
          <p style="white-space:pre-wrap;color:#333">${escapeHtml(message)}</p>
          <p style="color:#999;font-size:12px">Held statuses (guardian consent, NIL check, CPT) are not accepted until cleared.</p>
        </div>`,
      });
    }

    const heldForGuardian = row.status === "needs_guardian_consent";
    await sendEmail({
      to: row.email,
      subject: "We got your Flagger application, Talkin Flag",
      html: confirmationEmailHtml({
        heading: "Thanks for applying",
        body: heldForGuardian
          ? "We received your application. Because you are under 18, a parent or guardian needs to confirm it before we go further. We will email you about the next step."
          : "We received your application. If you are shortlisted, we will ask you for one practice recap, then talk through coverage in your area.",
      }),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

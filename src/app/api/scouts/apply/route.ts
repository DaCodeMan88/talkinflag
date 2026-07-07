import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, confirmationEmailHtml } from "@/lib/email";
import { notifyAdmins } from "@/lib/claims";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await req.json();
  const { full_name, email, location, affiliation, event_history, why_flag } = body;

  if (!full_name || !email || !location || !why_flag) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabase.from("scout_applications").insert({
    user_id: user?.id ?? null,
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    location: location.trim(),
    affiliation: affiliation?.trim() || null,
    event_history: event_history?.trim() || null,
    why_flag: why_flag.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const applicantEmail = email.trim().toLowerCase();
  const safeName = escapeHtml(full_name.trim());
  const safeEmail = escapeHtml(applicantEmail);

  // Admin notification. Never blocks the application.
  await notifyAdmins(
    `New scout application: ${full_name.trim()}`,
    `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#FDDD58">New Scout Application</h2>
        <p><strong>${safeName}</strong> &lt;${safeEmail}&gt; applied to become a scout.</p>
        <p><a href="https://talkinflag.com/admin/scouts">Review in Admin → Scouts</a></p>
      </div>
    `
  );

  // Applicant confirmation.
  await sendEmail({
    to: applicantEmail,
    subject: "Your scout application is pending review — Talkin Flag",
    html: confirmationEmailHtml({
      heading: "Application received!",
      body: `Thanks for applying to scout with Talkin Flag. Our team will review your application and follow up once it's been processed.`,
    }),
  });

  return NextResponse.json({ ok: true });
}

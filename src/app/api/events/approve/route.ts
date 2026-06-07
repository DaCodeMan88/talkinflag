import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin check
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (!adminEmails.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { event_id, action, notify } = await req.json();
  if (!event_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: ev } = await admin
    .from("events")
    .select("*")
    .eq("id", event_id)
    .single();

  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    const { error: updateError } = await admin
      .from("events")
      .update({ is_approved: true, rejected_at: null })
      .eq("id", event_id);
    if (updateError) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
  } else {
    const { error: updateError } = await admin
      .from("events")
      .update({ is_approved: false, rejected_at: new Date().toISOString() })
      .eq("id", event_id);
    if (updateError) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    if (notify && ev.submitter_email) {
      await sendEmail({
        to: ev.submitter_email,
        subject: "About your Talkin Flag event submission",
        html: `
          <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
            <p>Thanks so much for submitting <strong>${escapeHtml(ev.title ?? "your event")}</strong> to the Talkin Flag events calendar.</p>
            <p>After review, we weren't able to add this one to the calendar at this time. This isn't a reflection on your event — sometimes we need a little more detail, or it falls outside what we're able to feature right now.</p>
            <p>We'd genuinely welcome a resubmission with any additional information (dates, location, an official website, or a short description). You can submit again anytime at <a href="https://talkinflag.com/events/submit">talkinflag.com/events/submit</a>.</p>
            <p>Thanks for helping grow the global flag football community.</p>
            <p>— The Talkin Flag Team</p>
          </div>
        `,
        replyTo: "talkinflagshow@gmail.com",
      });
    }
  }

  return NextResponse.json({ ok: true });
}

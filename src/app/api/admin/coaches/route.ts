import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { isAdminEmail } from "@/lib/admin";
import { sendEmail } from "@/lib/email";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { coach_id, action } = await req.json();
  if (!coach_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: coach } = await db
    .from("coaches")
    .select("id, first_name, last_name, email, team, user_id")
    .eq("id", coach_id)
    .single();

  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newStatus = action === "approve" ? "approved" : "rejected";
  await db
    .from("coaches")
    .update({
      status: newStatus,
      is_verified: action === "approve",
      ...(action === "approve" ? { verified_at: new Date().toISOString() } : {}),
    })
    .eq("id", coach_id);

  // Email the coach
  if (action === "approve") {
    await sendEmail({
      to: coach.email,
      subject: "You're a verified coach on Talkin Flag ✓",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#000;color:#fff;padding:32px;">
          <p style="color:#FDDD58;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 24px;">Talkin Flag</p>
          <h1 style="font-size:28px;margin:0 0 12px;font-weight:900;text-transform:uppercase;">You're Verified ✓</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.6;">
            Hi ${coach.first_name}, your coach application for <strong>${coach.team}</strong> has been approved.
          </p>
          <ul style="color:rgba(255,255,255,0.6);font-size:14px;line-height:2;padding-left:20px;margin:20px 0;">
            <li>✓ Verified coach badge on your public profile</li>
            <li>Browse and flag players in the recruit database</li>
            <li>Post open roster spots</li>
            <li>Approve player stat verifications</li>
          </ul>
          <div style="margin:32px 0;">
            <a href="https://talkinflag.com/dashboard/recruiting" style="background:#FDDD58;color:#000;padding:12px 24px;font-weight:700;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;display:inline-block;">
              Go to Coach Dashboard →
            </a>
          </div>
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:32px;">Talkin Flag · talkinflag.com</p>
        </div>
      `,
    });
  } else {
    await sendEmail({
      to: coach.email,
      subject: "Update on your Talkin Flag coach application",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#000;color:#fff;padding:32px;">
          <p style="color:#FDDD58;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 24px;">Talkin Flag</p>
          <h1 style="font-size:24px;margin:0 0 12px;font-weight:900;text-transform:uppercase;">Application Update</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.6;">
            Hi ${coach.first_name}, we weren't able to approve your coach application at this time. Feel free to reply to this email if you have questions.
          </p>
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:32px;">Talkin Flag · talkinflag.com</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}

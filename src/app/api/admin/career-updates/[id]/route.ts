import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { isAdminEmail } from "@/lib/admin";
import { kindLabel } from "@/lib/career/kinds";
import { sendEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json().catch(() => ({}));
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = createAdminClient();

  const { data: update } = await db
    .from("career_updates")
    .select("id, subject_user_id, role, kind, detail")
    .eq("id", id)
    .single();
  if (!update) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .from("career_updates")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", id);

  if (status === "approved") {
    const detail = (update.detail ?? {}) as Record<string, string>;

    // Write-through: a coach's role/team/level change updates their coach row.
    if (update.kind === "role_change" && update.role === "coach") {
      const patch: Record<string, string> = {};
      if (detail.new_role) patch.title = detail.new_role;
      if (detail.team) patch.team = detail.team;
      if (detail.level) patch.level = detail.level;
      if (Object.keys(patch).length) {
        await db.from("coaches").update(patch).eq("user_id", update.subject_user_id);
      }
    }

    // Bump the member's claimed player profile so "recently updated" reflects it.
    await db
      .from("players")
      .update({ updated_at: new Date().toISOString() })
      .eq("claimed_by", update.subject_user_id);

    // Notify the member their update is live.
    const { data: userData } = await db.auth.admin.getUserById(update.subject_user_id);
    const email = userData?.user?.email;
    if (email) {
      await sendEmail({
        to: email,
        subject: "Your career update is live on Talkin Flag ✓",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#000;color:#fff;padding:32px;">
            <p style="color:#FDDD58;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 24px;">Talkin Flag</p>
            <h1 style="font-size:28px;margin:0 0 12px;font-weight:900;text-transform:uppercase;">Update Approved ✓</h1>
            <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.6;">
              Your career update — <strong>${kindLabel(update.kind)}${detail.title ? `: ${detail.title}` : ""}</strong> — has been approved and now shows on your Talkin Flag profile.
            </p>
            <div style="margin:32px 0;">
              <a href="https://talkinflag.com/dashboard" style="background:#FDDD58;color:#000;padding:12px 24px;font-weight:700;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;display:inline-block;">
                View Your Profile →
              </a>
            </div>
            <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:32px;">Talkin Flag · talkinflag.com</p>
          </div>
        `,
      }).catch(() => { /* email is best-effort */ });
    }
  }

  return NextResponse.json({ ok: true });
}

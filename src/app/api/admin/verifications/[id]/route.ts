import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "daniel@dubsportsentertainment.com";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status, playerId } = await req.json();
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Update verification status
  await supabase
    .from("stat_verifications")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", id);

  // If approved, mark player as is_verified and notify them
  if (status === "approved" && playerId) {
    const { count } = await supabase
      .from("stat_verifications")
      .select("id", { count: "exact", head: true })
      .eq("player_id", playerId)
      .eq("status", "approved");

    if ((count ?? 0) >= 1) {
      await supabase.from("players").update({ is_verified: true }).eq("id", playerId);
    }

    // Email the player who claimed this profile
    const { data: player } = await supabase
      .from("players")
      .select("first_name, last_name, claimed_by")
      .eq("id", playerId)
      .single();

    if (player?.claimed_by) {
      const admin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: userData } = await admin.auth.admin.getUserById(player.claimed_by);
      const playerEmail = userData?.user?.email;
      if (playerEmail) {
        await sendEmail({
          to: playerEmail,
          subject: "Your stat was verified on Talkin Flag ✓",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#000;color:#fff;padding:32px;">
              <p style="color:#FDDD58;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 24px;">Talkin Flag</p>
              <h1 style="font-size:28px;margin:0 0 12px;font-weight:900;text-transform:uppercase;">Stat Verified ✓</h1>
              <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.6;">
                Hi ${player.first_name}, a stat on your profile has been approved and your ✓ Verified badge is now live.
              </p>
              <div style="margin:32px 0;">
                <a href="https://talkinflag.vercel.app/dashboard" style="background:#FDDD58;color:#000;padding:12px 24px;font-weight:700;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;display:inline-block;">
                  View Your Profile →
                </a>
              </div>
              <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:32px;">Talkin Flag · talkinflag.vercel.app</p>
            </div>
          `,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

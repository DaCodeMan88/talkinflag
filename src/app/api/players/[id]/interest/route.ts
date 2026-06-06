import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: coach } = await supabase
    .from("coaches")
    .select("id, first_name, last_name, team, level")
    .eq("user_id", user.id)
    .eq("is_verified", true)
    .single();

  if (!coach) return NextResponse.json({ error: "Verified coach account required" }, { status: 403 });

  const { data: player } = await supabase
    .from("players")
    .select("id, first_name, last_name, position, claimed_by")
    .eq("id", id)
    .single();

  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* message is optional */ }
  const message = body.message ? String(body.message).slice(0, 500) : null;

  const { error } = await supabase
    .from("recruiting_interests")
    .upsert(
      { coach_id: coach.id, player_id: id, message },
      { onConflict: "coach_id,player_id", ignoreDuplicates: false }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Email notification to player if they have a claimed account
  if (player.claimed_by) {
    const { data: playerUser } = await supabase
      .from("players")
      .select("first_name")
      .eq("id", id)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(player.claimed_by);
    const playerEmail = authUser?.user?.email;

    if (playerEmail) {
      await sendEmail({
        to: playerEmail,
        subject: `A coach is interested in you — ${coach.first_name} ${coach.last_name}, ${coach.team}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#FDDD58">A Coach Is Interested In You</h2>
            <p>Hi ${playerUser?.first_name ?? ""},</p>
            <p><strong>${coach.first_name} ${coach.last_name}</strong> from <strong>${coach.team}</strong> has expressed interest in your Talkin Flag profile.</p>
            ${message ? `<blockquote style="border-left:3px solid #FDDD58;margin:16px 0;padding:8px 16px;color:#666">"${message}"</blockquote>` : ""}
            <p><a href="https://talkinflag.vercel.app/dashboard/recruiting" style="color:#FDDD58">View in your dashboard →</a></p>
            <p style="color:#999;font-size:12px">Talkin Flag Recruiting</p>
          </div>
        `,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: coach } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!coach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await supabase
    .from("recruiting_interests")
    .delete()
    .eq("coach_id", coach.id)
    .eq("player_id", id);

  return NextResponse.json({ ok: true });
}

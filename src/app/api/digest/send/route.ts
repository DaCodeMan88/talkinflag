import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

// Called by Vercel cron every Sunday. Secured with CRON_SECRET.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Load all follows
  const { data: allFollows } = await supabase
    .from("follows")
    .select("follower_id, followed_id, followed_type");

  if (!allFollows || allFollows.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group by follower
  const byFollower = new Map<string, { players: string[]; coaches: string[] }>();
  for (const f of allFollows) {
    if (!byFollower.has(f.follower_id)) {
      byFollower.set(f.follower_id, { players: [], coaches: [] });
    }
    const entry = byFollower.get(f.follower_id)!;
    if (f.followed_type === "player") entry.players.push(f.followed_id);
    if (f.followed_type === "coach") entry.coaches.push(f.followed_id);
  }

  // Load activity: stat verifications approved in past 7 days
  const allPlayerIds = [...new Set(allFollows.filter((f) => f.followed_type === "player").map((f) => f.followed_id))];
  const allCoachIds = [...new Set(allFollows.filter((f) => f.followed_type === "coach").map((f) => f.followed_id))];

  const [verificationsRes, rosterSpotsRes, playerNamesRes, coachNamesRes] = await Promise.all([
    allPlayerIds.length > 0
      ? supabase
          .from("stat_verifications")
          .select("player_id, stat_key, updated_at")
          .in("player_id", allPlayerIds)
          .eq("status", "approved")
          .gte("updated_at", sevenDaysAgo)
      : { data: [] },
    allCoachIds.length > 0
      ? supabase
          .from("coach_roster_spots")
          .select("coach_id, position, created_at")
          .in("coach_id", allCoachIds)
          .eq("is_active", true)
          .gte("created_at", sevenDaysAgo)
      : { data: [] },
    allPlayerIds.length > 0
      ? supabase.from("players").select("id, first_name, last_name").in("id", allPlayerIds)
      : { data: [] },
    allCoachIds.length > 0
      ? supabase.from("coaches").select("id, first_name, last_name").in("id", allCoachIds)
      : { data: [] },
  ]);

  const playerNames = new Map((playerNamesRes.data ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`]));
  const coachNames = new Map((coachNamesRes.data ?? []).map((c) => [c.id, `${c.first_name} ${c.last_name}`]));

  // Index activity by entity id
  const verificationsByPlayer = new Map<string, string[]>();
  for (const v of verificationsRes.data ?? []) {
    const key = v.stat_key.replace(/_/g, " ");
    if (!verificationsByPlayer.has(v.player_id)) verificationsByPlayer.set(v.player_id, []);
    verificationsByPlayer.get(v.player_id)!.push(key);
  }

  const spotsByCoach = new Map<string, string[]>();
  for (const s of rosterSpotsRes.data ?? []) {
    if (!spotsByCoach.has(s.coach_id)) spotsByCoach.set(s.coach_id, []);
    spotsByCoach.get(s.coach_id)!.push(s.position ?? "open spot");
  }

  let sent = 0;

  for (const [followerId, { players, coaches }] of byFollower) {
    const lines: string[] = [];

    for (const pid of players) {
      const verifications = verificationsByPlayer.get(pid);
      if (verifications?.length) {
        const name = playerNames.get(pid) ?? "A player you follow";
        lines.push(`<li><strong>${name}</strong> had ${verifications.join(", ")} verified ✓</li>`);
      }
    }

    for (const cid of coaches) {
      const spots = spotsByCoach.get(cid);
      if (spots?.length) {
        const name = coachNames.get(cid) ?? "A coach you follow";
        lines.push(`<li><strong>${name}</strong> posted ${spots.length} new roster spot${spots.length > 1 ? "s" : ""} (${spots.join(", ")})</li>`);
      }
    }

    if (lines.length === 0) continue; // no activity — skip

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(followerId);
    const email = userData?.user?.email;
    if (!email) continue;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#000;color:#fff;padding:32px;">
        <p style="color:#FDDD58;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 24px;">Talkin Flag · Weekly Digest</p>
        <h1 style="font-size:28px;margin:0 0 8px;font-weight:900;text-transform:uppercase;">This Week in Flag</h1>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 32px;">Updates from the players and coaches you follow.</p>
        <ul style="padding-left:20px;color:rgba(255,255,255,0.85);font-size:15px;line-height:1.8;">
          ${lines.join("")}
        </ul>
        <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.1);">
          <a href="https://talkinflag.vercel.app/dashboard/following" style="background:#FDDD58;color:#000;padding:12px 24px;font-weight:700;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;display:inline-block;">
            View Your Following →
          </a>
        </div>
        <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:32px;">
          You're receiving this because you follow players or coaches on Talkin Flag.<br/>
          <a href="https://talkinflag.vercel.app/dashboard/following" style="color:rgba(253,221,88,0.5);">Manage who you follow</a>
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Your Talkin Flag Weekly Digest",
      html,
    });
    sent++;
  }

  return NextResponse.json({ sent });
}

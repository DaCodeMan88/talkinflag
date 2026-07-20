import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { completionScore } from "@/lib/profile/completion";
import { sendEmail } from "@/lib/email";
import { isEligibleForAutoNudge, nudgeEmailHtml, NUDGE_SUBJECT } from "@/lib/nudge";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const MAX_PER_RUN = 50;

function isCronRequest(req: NextRequest): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  return Boolean(CRON_SECRET) && auth === `Bearer ${CRON_SECRET}`;
}

async function runNudges() {
  const db = createAdminClient();

  const [{ data: usersPage }, { data: players }, { data: nudged }] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db
      .from("players")
      .select("claimed_by, photo_url, bio, instagram, highlight_url, height_in, weight_lbs, stats")
      .not("claimed_by", "is", null),
    db.from("profile_nudges").select("user_id").eq("source", "auto_day10"),
  ]);

  const playerByUser = new Map((players ?? []).map((p) => [p.claimed_by as string, p]));
  const autoNudgedUsers = new Set((nudged ?? []).map((n) => n.user_id as string));
  const now = Date.now();

  let sent = 0;
  for (const u of usersPage?.users ?? []) {
    if (sent >= MAX_PER_RUN) break;
    if (!u.email) continue;

    const player = playerByUser.get(u.id);
    const completionPct = player
      ? completionScore(player as Record<string, unknown>, (player.stats ?? {}) as Record<string, unknown>)
      : 0;
    const ageDays = (now - new Date(u.created_at).getTime()) / 86_400_000;

    if (!isEligibleForAutoNudge({ ageDays, completionPct, alreadyAutoNudged: autoNudgedUsers.has(u.id) })) {
      continue;
    }

    const firstName = (u.user_metadata?.first_name as string | undefined) ?? null;
    const result = await sendEmail({ to: u.email, subject: NUDGE_SUBJECT, html: nudgeEmailHtml(firstName) });
    if (result.ok) {
      await db.from("profile_nudges").insert({ user_id: u.id, source: "auto_day10" });
      sent++;
    }
  }

  return NextResponse.json({ sent });
}

export async function GET(req: NextRequest) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runNudges();
}

export async function POST(req: NextRequest) {
  if (!isCronRequest(req)) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return runNudges();
}

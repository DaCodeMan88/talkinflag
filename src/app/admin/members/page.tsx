import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getAdminUser } from "@/lib/admin";
import { completionScore } from "@/lib/profile/completion";
import { accountSignal } from "@/lib/admin/account-signal";
import MembersTable, { type MemberRow } from "./MembersTable";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/");

  const db = createAdminClient();

  const [
    { data: usersPage },
    { data: players },
    { data: evals },
    { data: iqRows },
    { data: coaches },
    { data: nudges },
    { data: sessions },
    { data: drafts },
  ] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db
      .from("players")
      .select(
        "id, first_name, last_name, claimed_by, claim_pending, is_verified, review_status, photo_url, bio, instagram, highlight_url, height_in, weight_lbs, stats"
      )
      .not("claimed_by", "is", null),
    db.from("eval_responses").select("user_id, created_at"),
    db.from("iq_best").select("user_id, score_pct").eq("category", "general"),
    db.from("coaches").select("user_id, first_name, last_name, is_verified"),
    db.from("profile_nudges").select("user_id, sent_at"),
    db.from("assessment_sessions").select("user_id"),
    db.from("form_drafts").select("user_id"),
  ]);

  const playerByUser = new Map((players ?? []).map((p) => [p.claimed_by as string, p]));
  const coachByUser = new Map((coaches ?? []).map((c) => [c.user_id as string, c]));
  const iqByUser = new Map((iqRows ?? []).map((r) => [r.user_id as string, r.score_pct as number]));
  const evalsByUser = new Map<string, { count: number; last: string }>();
  for (const e of evals ?? []) {
    const cur = evalsByUser.get(e.user_id) ?? { count: 0, last: "" };
    cur.count += 1;
    if (e.created_at > cur.last) cur.last = e.created_at;
    evalsByUser.set(e.user_id, cur);
  }

  const sessionsByUser = new Map<string, number>();
  for (const s of sessions ?? []) {
    const uid = s.user_id as string | null;
    if (uid) sessionsByUser.set(uid, (sessionsByUser.get(uid) ?? 0) + 1);
  }

  const draftsByUser = new Map<string, number>();
  for (const d of drafts ?? []) {
    const uid = d.user_id as string | null;
    if (uid) draftsByUser.set(uid, (draftsByUser.get(uid) ?? 0) + 1);
  }

  const lastNudgeByUser = new Map<string, string>();
  const nudgeCountByUser = new Map<string, number>();
  for (const n of nudges ?? []) {
    const uid = n.user_id as string;
    const prev = lastNudgeByUser.get(uid);
    if (!prev || (n.sent_at as string) > prev) lastNudgeByUser.set(uid, n.sent_at as string);
    nudgeCountByUser.set(uid, (nudgeCountByUser.get(uid) ?? 0) + 1);
  }

  const now = new Date();

  const members: MemberRow[] = (usersPage?.users ?? [])
    .map((u) => {
      const player = playerByUser.get(u.id);
      const coach = coachByUser.get(u.id);
      const ev = evalsByUser.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "—",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        playerName: player ? `${player.first_name} ${player.last_name}` : null,
        playerId: player ? (player.id as string) : null,
        claimPending: !!player?.claim_pending,
        isVerifiedPlayer: !!player?.is_verified,
        reviewStatus: (player?.review_status as string | null) ?? null,
        profilePct: player
          ? completionScore(
              player as Record<string, unknown>,
              (player.stats ?? {}) as Record<string, unknown>
            )
          : null,
        coachName: coach ? `${coach.first_name} ${coach.last_name}` : null,
        coachVerified: !!coach?.is_verified,
        evalCount: ev?.count ?? 0,
        lastEvalAt: ev?.last || null,
        iqBest: iqByUser.get(u.id) ?? null,
        lastNudgeAt: lastNudgeByUser.get(u.id) ?? null,
        signal: accountSignal({
          provider: (u.app_metadata?.provider as string | undefined) ?? "email",
          evals: ev?.count ?? 0,
          sessions: sessionsByUser.get(u.id) ?? 0,
          drafts: draftsByUser.get(u.id) ?? 0,
          hasPlayer: !!player,
          hasCoach: !!coach,
          nudges: nudgeCountByUser.get(u.id) ?? 0,
          emailConfirmed: !!u.email_confirmed_at,
          createdAt: u.created_at,
          now,
        }),
      };
    })
    .sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-8">
        <h1 className="font-display text-4xl uppercase text-white leading-none">Members</h1>
        <p className="text-white/40 mt-2 text-sm">Every signed-up account, with activity and linked profiles</p>
      </div>
      <MembersTable members={members} currentUserId={admin.id} />
    </div>
  );
}

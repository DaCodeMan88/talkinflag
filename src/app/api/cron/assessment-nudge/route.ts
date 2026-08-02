import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { sendEmail } from "@/lib/email";
import { isAbandoned } from "@/lib/assessments/session";
import { assessmentNudgeEmail } from "@/lib/emails/assessment-nudge";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const MAX_PER_RUN = 50;
// Never nudge a shallow bounce — <3 answers reads as spam.
const MIN_ANSWERED = 3;

function isCronRequest(req: NextRequest): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  return Boolean(CRON_SECRET) && auth === `Bearer ${CRON_SECRET}`;
}

type OpenSession = {
  id: string;
  user_id: string;
  kind: "eval" | "iq";
  subject_key: string;
  total_items: number;
  answered_count: number;
  completed_at: string | null;
  last_seen_at: string;
};

function firstNameFrom(meta: Record<string, unknown> | undefined | null): string {
  const raw =
    (meta?.first_name as string | undefined) ??
    (meta?.full_name as string | undefined) ??
    (meta?.name as string | undefined) ??
    "";
  const first = raw.trim().split(/\s+/)[0];
  return first || "there";
}

function resumeUrlFor(s: OpenSession): string {
  return s.kind === "eval"
    ? "https://talkinflag.com/evaluate"
    : `https://talkinflag.com/iq/${s.subject_key}`;
}

export async function GET(req: NextRequest) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const isoSevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  // The `nudged_at IS NULL` filter is the once-ever guard: a session stamped on
  // a prior run is excluded here, so it can never be nudged twice.
  const { data, error } = await db
    .from("assessment_sessions")
    .select(
      "id, user_id, kind, subject_key, total_items, answered_count, completed_at, last_seen_at"
    )
    .is("completed_at", null)
    .is("nudged_at", null)
    .gte("started_at", isoSevenDaysAgo)
    .order("last_seen_at", { ascending: true });

  if (error) {
    console.error(`[assessment-nudge] query failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const rows = (data ?? []) as OpenSession[];
  let scanned = 0;
  let sent = 0;

  for (const s of rows) {
    if (sent >= MAX_PER_RUN) break;
    scanned++;

    if (s.answered_count < MIN_ANSWERED) continue;
    if (!isAbandoned(s, now)) continue;

    const { data: userData } = await db.auth.admin.getUserById(s.user_id);
    const email = userData?.user?.email;
    if (!email) continue;

    const firstName = firstNameFrom(userData?.user?.user_metadata);
    const { subject, html } = assessmentNudgeEmail({
      firstName,
      kind: s.kind,
      answered: s.answered_count,
      total: s.total_items,
      resumeUrl: resumeUrlFor(s),
    });

    const result = await sendEmail({ to: email, subject, html });
    // Stamp ONLY on a successful send, so a failure retries next run.
    if (result.ok) {
      await db
        .from("assessment_sessions")
        .update({ nudged_at: new Date().toISOString() })
        .eq("id", s.id);
      sent++;
    }
  }

  return NextResponse.json({ ok: true, scanned, sent });
}

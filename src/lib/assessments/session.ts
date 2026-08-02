import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/eval/admin-client";

export type SessionKind = "eval" | "iq";

export type SessionRow = {
  id: string;
  nonce: string;
  total_items: number;
  answered_count: number;
  last_index: number;
  completed_at: string | null;
};

const ABANDON_AFTER_MS = 30 * 60 * 1000;

// ---------- pure helpers (tested) ----------

export function completionRate(rows: { completed_at: string | null }[]): number {
  if (rows.length === 0) return 0;
  const done = rows.filter((r) => r.completed_at).length;
  return Math.round((done / rows.length) * 1000) / 10;
}

/** Count of unfinished sessions whose furthest question was index i. */
export function dropOffHistogram(
  rows: { completed_at: string | null; last_index: number }[],
  totalItems: number
): number[] {
  const out = new Array(totalItems).fill(0);
  for (const r of rows) {
    if (r.completed_at) continue;
    const i = Math.min(Math.max(r.last_index, 0), totalItems - 1);
    out[i] += 1;
  }
  return out;
}

/** Unfinished, idle past the window, and they had actually engaged. */
export function isAbandoned(
  row: { completed_at: string | null; answered_count: number; last_seen_at: string },
  now: Date = new Date()
): boolean {
  if (row.completed_at) return false;
  if (row.answered_count < 1) return false;
  return now.getTime() - new Date(row.last_seen_at).getTime() > ABANDON_AFTER_MS;
}

// ---------- DB wrappers (service role only) ----------

export async function startSession(args: {
  userId: string;
  kind: SessionKind;
  subjectKey: string;
  totalItems: number;
  userAgent?: string | null;
}): Promise<SessionRow> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("assessment_sessions")
    .insert({
      user_id: args.userId,
      kind: args.kind,
      subject_key: args.subjectKey,
      nonce: randomBytes(16).toString("hex"),
      total_items: args.totalItems,
      user_agent: args.userAgent ?? null,
    })
    .select("id, nonce, total_items, answered_count, last_index, completed_at")
    .single();
  if (error) throw new Error(`startSession: ${error.message}`);
  await db.from("assessment_events").insert({ session_id: data.id, type: "start", item_index: 0 });
  return data as SessionRow;
}

/** Load a session, enforcing ownership. Returns null if missing or not theirs. */
export async function getOwnedSession(sessionId: string, userId: string): Promise<SessionRow | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("assessment_sessions")
    .select("id, nonce, total_items, answered_count, last_index, completed_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .limit(1);
  return (data?.[0] as SessionRow) ?? null;
}

export async function recordEvent(args: {
  sessionId: string;
  type: "answer" | "back" | "resume" | "checkpoint" | "complete";
  itemIndex?: number;
  itemId?: string | null;
  correct?: boolean | null;
  msOnItem?: number | null;
  answeredCount?: number;
}): Promise<void> {
  const db = createAdminClient();
  await db.from("assessment_events").insert({
    session_id: args.sessionId,
    type: args.type,
    item_index: args.itemIndex ?? null,
    item_id: args.itemId ?? null,
    correct: args.correct ?? null,
    ms_on_item: args.msOnItem ?? null,
  });

  const patch: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
  if (args.itemIndex !== undefined) patch.last_index = args.itemIndex;
  if (args.answeredCount !== undefined) patch.answered_count = args.answeredCount;
  if (args.type === "complete") patch.completed_at = new Date().toISOString();
  await db.from("assessment_sessions").update(patch).eq("id", args.sessionId);
}

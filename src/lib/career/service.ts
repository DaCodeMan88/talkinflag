// Server-only reads for career updates. career_updates has RLS enabled with no
// policies, so every read goes through the service-role admin client.
import { createAdminClient } from "@/lib/eval/admin-client";
import { rankingsStale } from "./kinds";

export interface CareerUpdateDetail {
  title?: string;
  description?: string;
  date?: string;
  team?: string;
  level?: string;
  new_role?: string;
  [k: string]: unknown;
}

export interface CareerUpdateRow {
  id: string;
  subject_user_id: string;
  role: string;
  kind: string;
  detail: CareerUpdateDetail;
  evidence_url: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
  created_at: string;
}

/** Approved career updates for one member (newest first), for profile freshness. */
export async function getApprovedUpdatesForUser(
  userId: string,
  limit = 6,
): Promise<CareerUpdateRow[]> {
  if (!userId) return [];
  const db = createAdminClient();
  const { data } = await db
    .from("career_updates")
    .select("id, subject_user_id, role, kind, detail, evidence_url, status, reviewed_at, created_at")
    .eq("subject_user_id", userId)
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as CareerUpdateRow[];
}

/** Whether published rankings are stale because ranking-relevant updates were
 *  approved since the last recompute. Used by the admin rankings panel. */
export async function getRankingsStaleInfo(): Promise<{
  stale: boolean;
  lastRecomputeAt: string | null;
  latestApprovalAt: string | null;
}> {
  const db = createAdminClient();
  const [{ data: lastSnap }, { data: approvals }] = await Promise.all([
    db.from("ranking_snapshots").select("snapshotted_at").order("snapshotted_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("career_updates").select("kind, reviewed_at").eq("status", "approved").order("reviewed_at", { ascending: false }).limit(50),
  ]);

  const lastRecomputeAt = (lastSnap?.snapshotted_at as string | undefined) ?? null;
  // Newest ranking-relevant approval.
  const { isRankingRelevant } = await import("./kinds");
  const relevant = (approvals ?? []).filter((a) => isRankingRelevant(a.kind as string));
  const latestApprovalAt = (relevant[0]?.reviewed_at as string | undefined) ?? null;

  return {
    stale: rankingsStale(lastRecomputeAt, latestApprovalAt),
    lastRecomputeAt,
    latestApprovalAt,
  };
}

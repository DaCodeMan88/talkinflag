import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getRankingsStaleInfo } from "@/lib/career/service";
import RankingsRecomputePanel from "./RankingsRecomputePanel";

export default async function AdminRankingsPage() {
  if (!(await getAdminUser())) redirect("/");
  const supabase = createAdminClient();

  const { count: totalPlayers } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true });

  const { count: rankedPlayers } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .not("ranking_national", "is", null);

  const { data: latestSnapshot } = await supabase
    .from("ranking_snapshots")
    .select("snapshotted_at")
    .order("snapshotted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { stale } = await getRankingsStaleInfo();

  return (
    <RankingsRecomputePanel
      totalPlayers={totalPlayers ?? 0}
      rankedPlayers={rankedPlayers ?? 0}
      lastRun={latestSnapshot?.snapshotted_at ?? null}
      stale={stale}
    />
  );
}

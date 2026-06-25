import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRankingsStaleInfo } from "@/lib/career/service";
import RankingsRecomputePanel from "./RankingsRecomputePanel";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
  .split(",").map((e) => e.trim()).filter(Boolean);

export default async function AdminRankingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) redirect("/");

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

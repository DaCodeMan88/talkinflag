import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase";
import ReportActions from "./ReportActions";

export const dynamic = "force-dynamic";

type Report = {
  id: string;
  player_id: string;
  reason: string | null;
  reporter_email: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
};

export default async function AdminReportsPage() {
  if (!(await getAdminUser())) redirect("/");
  const db = createServerClient();

  const { data: reportsRaw } = await db
    .from("profile_reports")
    .select("id, player_id, reason, reporter_email, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: true });

  const reports = (reportsRaw ?? []) as Report[];
  const playerIds = [...new Set(reports.map((r) => r.player_id))];
  const { data: playersRaw } = playerIds.length
    ? await db.from("players").select("id, first_name, last_name, is_claimed").in("id", playerIds)
    : { data: [] };
  const playersById = Object.fromEntries((playersRaw ?? []).map((p) => [p.id, p]));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-3xl text-white tracking-wide">Admin · Reports</h1>
        {reports.length > 0 && (
          <span className="bg-[#FDDD58] text-black text-sm font-bold px-2.5 py-0.5 rounded-full">{reports.length}</span>
        )}
      </div>

      {reports.length === 0 ? (
        <p className="text-white/50 text-sm">No open reports. ✓</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            const player = playersById[r.player_id];
            return (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    {player ? (
                      <Link href={`/players/${player.id}`} className="text-[#FDDD58] font-semibold hover:underline">
                        {player.first_name} {player.last_name}
                      </Link>
                    ) : (
                      <p className="text-white/50">Player no longer exists</p>
                    )}
                    {player?.is_claimed && (
                      <span className="text-white/40 text-xs">Currently claimed</span>
                    )}
                  </div>
                  <span className="text-white/40 text-xs">
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                {r.reason && <p className="text-white/80 text-sm">{r.reason}</p>}
                {r.reporter_email && <p className="text-white/40 text-xs">Reporter: {r.reporter_email}</p>}

                {player && <ReportActions reportId={r.id} playerId={player.id} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

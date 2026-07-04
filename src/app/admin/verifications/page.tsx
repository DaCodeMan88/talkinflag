import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import VerificationActions from "./VerificationActions";

type Player = {
  first_name: string;
  last_name: string;
  position: string | null;
  school_or_team: string | null;
};

type PendingVerification = {
  id: string;
  stat_key: string;
  stat_value: string | number | null;
  source_type: string | null;
  source_url: string | null;
  created_at: string;
  player_id: string;
  players: Player | null;
};

type RecentVerification = {
  id: string;
  stat_key: string;
  stat_value: string | number | null;
  status: string;
  reviewed_at: string | null;
  player_id: string;
  players: { first_name: string; last_name: string } | null;
};

export default async function VerificationsPage() {
  if (!(await getAdminUser())) redirect("/");
  const supabase = createAdminClient();

  const { data: pendingRaw } = await supabase
    .from("stat_verifications")
    .select(
      "id, stat_key, stat_value, source_type, source_url, created_at, player_id, players(first_name, last_name, position, school_or_team)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: recentRaw } = await supabase
    .from("stat_verifications")
    .select(
      "id, stat_key, stat_value, status, reviewed_at, player_id, players(first_name, last_name)"
    )
    .in("status", ["approved", "rejected"])
    .order("reviewed_at", { ascending: false })
    .limit(20);

  const pending = (pendingRaw ?? []) as unknown as PendingVerification[];
  const recent = (recentRaw ?? []) as unknown as RecentVerification[];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <h1 className="font-display text-3xl text-white tracking-wide">
          Admin · Stat Verifications
        </h1>
        {pending.length > 0 && (
          <span className="bg-[#FDDD58] text-black text-sm font-bold px-2.5 py-0.5 rounded-full">
            {pending.length}
          </span>
        )}
      </div>

      {/* Pending */}
      <section>
        <h2 className="text-lg font-semibold text-white/80 mb-4">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-white/50 text-sm">No pending verifications. ✓</p>
        ) : (
          <div className="space-y-4">
            {pending.map((v) => {
              const player = v.players;
              const submittedDate = new Date(v.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div
                  key={v.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <Link
                        href={`/players/${v.player_id}`}
                        className="text-[#FDDD58] font-semibold hover:underline"
                      >
                        {player ? `${player.first_name} ${player.last_name}` : v.player_id}
                      </Link>
                      {player && (
                        <p className="text-white/50 text-xs mt-0.5">
                          {[player.position, player.school_or_team].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="text-white/40 text-xs">{submittedDate}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-white/10 text-white/80 text-xs font-mono px-2 py-1 rounded">
                      {v.stat_key}: {v.stat_value ?? "—"}
                    </span>
                    {v.source_type && (
                      <span className="bg-[#FDDD58]/15 text-[#FDDD58] text-xs px-2 py-1 rounded">
                        {v.source_type}
                      </span>
                    )}
                    {v.source_url && (
                      <a
                        href={v.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-xs hover:underline truncate max-w-xs"
                      >
                        {v.source_url}
                      </a>
                    )}
                  </div>

                  <VerificationActions verificationId={v.id} playerId={v.player_id} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recently Reviewed */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-4">Recently Reviewed</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-white/70">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="text-left pb-2 pr-4">Player</th>
                  <th className="text-left pb-2 pr-4">Stat</th>
                  <th className="text-left pb-2 pr-4">Status</th>
                  <th className="text-left pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recent.map((v) => {
                  const player = v.players;
                  const reviewedDate = v.reviewed_at
                    ? new Date(v.reviewed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "—";
                  return (
                    <tr key={v.id}>
                      <td className="py-2 pr-4">
                        {player ? `${player.first_name} ${player.last_name}` : "—"}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {v.stat_key}: {v.stat_value ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            v.status === "approved"
                              ? "bg-green-900/40 text-green-400"
                              : "bg-red-900/40 text-red-400"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-2 text-white/40 text-xs">{reviewedDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

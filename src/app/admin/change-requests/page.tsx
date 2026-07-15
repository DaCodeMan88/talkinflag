import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { guardedFieldLabel, type GuardedField } from "@/lib/profile/change-request";
import ChangeRequestActions from "./ChangeRequestActions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  player_id: string;
  field: GuardedField;
  old_value: string | null;
  new_value: string;
  status: string;
  reviewed_at: string | null;
  created_at: string;
  players: { first_name: string; last_name: string } | null;
};

export default async function AdminChangeRequestsPage() {
  if (!(await getAdminUser())) redirect("/");
  const db = createAdminClient();

  const [{ data: pendingRaw }, { data: recentRaw }] = await Promise.all([
    db
      .from("profile_change_requests")
      .select("id, player_id, field, old_value, new_value, status, reviewed_at, created_at, players(first_name, last_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    db
      .from("profile_change_requests")
      .select("id, player_id, field, old_value, new_value, status, reviewed_at, created_at, players(first_name, last_name)")
      .in("status", ["approved", "rejected"])
      .order("reviewed_at", { ascending: false })
      .limit(20),
  ]);

  const pending = (pendingRaw ?? []) as unknown as Row[];
  const recent = (recentRaw ?? []) as unknown as Row[];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-3xl text-white tracking-wide">Admin · Change Requests</h1>
        {pending.length > 0 && (
          <span className="bg-[#FDDD58] text-black text-sm font-bold px-2.5 py-0.5 rounded-full">{pending.length}</span>
        )}
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white/80 mb-4">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-white/50 text-sm">No pending requests. ✓</p>
        ) : (
          <div className="space-y-4">
            {pending.map((r) => (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[#FDDD58] font-semibold">
                      {r.players ? `${r.players.first_name} ${r.players.last_name}` : "Unknown player"}
                    </p>
                    <p className="text-white/50 text-xs mt-0.5">{guardedFieldLabel(r.field)}</p>
                  </div>
                  <span className="text-white/40 text-xs">
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                <p className="text-white/80 text-sm">
                  <span className="text-white/40">{r.old_value || "—"}</span>
                  <span className="text-white/30 mx-2">→</span>
                  <span className="text-white font-medium">{r.new_value}</span>
                </p>

                <ChangeRequestActions requestId={r.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-4">Recently Reviewed</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-white/70">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="text-left pb-2 pr-4">Player</th>
                  <th className="text-left pb-2 pr-4">Change</th>
                  <th className="text-left pb-2 pr-4">Status</th>
                  <th className="text-left pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-4">
                      {r.players ? `${r.players.first_name} ${r.players.last_name}` : "—"}
                    </td>
                    <td className="py-2 pr-4 text-xs">
                      {guardedFieldLabel(r.field)}: {r.old_value || "—"} → {r.new_value}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status === "approved" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 text-white/40 text-xs">
                      {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase";
import ReleaseClaimButton from "./ReleaseClaimButton";

export const dynamic = "force-dynamic";

type ClaimEvent = {
  id: string;
  player_id: string;
  user_id: string | null;
  action: "claim" | "release";
  actor: "self" | "admin";
  note: string | null;
  created_at: string;
};

export default async function AdminClaimsPage() {
  if (!(await getAdminUser())) redirect("/");
  const db = createServerClient();

  const [{ data: eventsRaw }, { data: { users } }] = await Promise.all([
    db
      .from("claim_events")
      .select("id, player_id, user_id, action, actor, note, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    db.auth.admin.listUsers(),
  ]);

  const events = (eventsRaw ?? []) as ClaimEvent[];
  const emailById = Object.fromEntries(users.map((u) => [u.id, u.email ?? "—"]));

  const playerIds = [...new Set(events.map((e) => e.player_id))];
  const { data: playersRaw } = playerIds.length
    ? await db.from("players").select("id, first_name, last_name, is_claimed, claimed_by").in("id", playerIds)
    : { data: [] };
  const playersById = Object.fromEntries((playersRaw ?? []).map((p) => [p.id, p]));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-3xl text-white tracking-wide">Admin · Recent Claims</h1>
      </div>
      <p className="text-white/40 text-sm">
        Audit log of every profile claim and admin release. Report flags are reviewed separately at{" "}
        <Link href="/admin/reports" className="text-[#FDDD58]/70 hover:text-[#FDDD58]">Admin → Reports</Link>.
      </p>

      {events.length === 0 ? (
        <p className="text-white/50 text-sm">No claim activity yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-white/70">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                <th className="text-left pb-2 pr-4">Player</th>
                <th className="text-left pb-2 pr-4">Action</th>
                <th className="text-left pb-2 pr-4">Actor / Account</th>
                <th className="text-left pb-2 pr-4">Note</th>
                <th className="text-left pb-2 pr-4">Date</th>
                <th className="text-left pb-2">—</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.map((e) => {
                const player = playersById[e.player_id];
                const canRelease = e.action === "claim" && player?.is_claimed;
                return (
                  <tr key={e.id}>
                    <td className="py-2 pr-4">
                      {player ? (
                        <Link href={`/players/${player.id}`} className="text-[#FDDD58]/80 hover:text-[#FDDD58]">
                          {player.first_name} {player.last_name}
                        </Link>
                      ) : (
                        "— (deleted)"
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${e.action === "claim" ? "bg-green-900/40 text-green-400" : "bg-white/10 text-white/60"}`}>
                        {e.action}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-xs">
                      {e.actor} {e.user_id ? `· ${emailById[e.user_id] ?? e.user_id}` : ""}
                    </td>
                    <td className="py-2 pr-4 text-xs text-white/40">{e.note ?? "—"}</td>
                    <td className="py-2 pr-4 text-white/40 text-xs">
                      {new Date(e.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </td>
                    <td className="py-2">
                      {canRelease && <ReleaseClaimButton playerId={player!.id} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

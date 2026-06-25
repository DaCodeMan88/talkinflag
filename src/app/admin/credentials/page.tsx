import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { kindLabel, isRankingRelevant } from "@/lib/career/kinds";
import CareerUpdateActions from "./CareerUpdateActions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  subject_user_id: string;
  role: string;
  kind: string;
  detail: Record<string, string>;
  evidence_url: string | null;
  status: string;
  reviewed_at: string | null;
  created_at: string;
};

async function resolveNames(db: ReturnType<typeof createAdminClient>, userIds: string[]) {
  const names: Record<string, string> = {};
  if (!userIds.length) return names;
  const [{ data: players }, { data: coaches }] = await Promise.all([
    db.from("players").select("claimed_by, first_name, last_name").in("claimed_by", userIds),
    db.from("coaches").select("user_id, first_name, last_name").in("user_id", userIds),
  ]);
  for (const c of coaches ?? []) {
    if (c.user_id) names[c.user_id] = `${c.first_name} ${c.last_name}`;
  }
  for (const p of players ?? []) {
    if (p.claimed_by) names[p.claimed_by] = `${p.first_name} ${p.last_name}`;
  }
  return names;
}

function detailSummary(detail: Record<string, string>): string {
  return [detail.title, detail.new_role, detail.team, detail.level, detail.date]
    .filter(Boolean)
    .join(" · ");
}

export default async function AdminCredentialsPage() {
  if (!(await getAdminUser())) redirect("/");
  const db = createAdminClient();

  const [{ data: pendingRaw }, { data: recentRaw }] = await Promise.all([
    db.from("career_updates")
      .select("id, subject_user_id, role, kind, detail, evidence_url, status, reviewed_at, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    db.from("career_updates")
      .select("id, subject_user_id, role, kind, detail, evidence_url, status, reviewed_at, created_at")
      .in("status", ["approved", "rejected"])
      .order("reviewed_at", { ascending: false })
      .limit(20),
  ]);

  const pending = (pendingRaw ?? []) as Row[];
  const recent = (recentRaw ?? []) as Row[];
  const names = await resolveNames(db, [...new Set([...pending, ...recent].map((r) => r.subject_user_id))]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-3xl text-white tracking-wide">Admin · Career Updates</h1>
        {pending.length > 0 && (
          <span className="bg-[#FDDD58] text-black text-sm font-bold px-2.5 py-0.5 rounded-full">{pending.length}</span>
        )}
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white/80 mb-4">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-white/50 text-sm">No pending updates. ✓</p>
        ) : (
          <div className="space-y-4">
            {pending.map((v) => (
              <div key={v.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[#FDDD58] font-semibold">{names[v.subject_user_id] ?? "Member"}</p>
                    <p className="text-white/50 text-xs mt-0.5 capitalize">{v.role}</p>
                  </div>
                  <span className="text-white/40 text-xs">
                    {new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded">{kindLabel(v.kind)}</span>
                  {isRankingRelevant(v.kind) && (
                    <span className="bg-[#FDDD58]/15 text-[#FDDD58] text-xs px-2 py-1 rounded">affects rankings</span>
                  )}
                  {v.evidence_url && (
                    <a href={v.evidence_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline truncate max-w-xs">
                      {v.evidence_url}
                    </a>
                  )}
                </div>

                {detailSummary(v.detail) && <p className="text-white/80 text-sm">{detailSummary(v.detail)}</p>}
                {v.detail.description && <p className="text-white/50 text-sm">{v.detail.description}</p>}

                <CareerUpdateActions updateId={v.id} />
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
                  <th className="text-left pb-2 pr-4">Member</th>
                  <th className="text-left pb-2 pr-4">Update</th>
                  <th className="text-left pb-2 pr-4">Status</th>
                  <th className="text-left pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recent.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2 pr-4">{names[v.subject_user_id] ?? "—"}</td>
                    <td className="py-2 pr-4 text-xs">{kindLabel(v.kind)}{v.detail.title ? ` — ${v.detail.title}` : ""}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${v.status === "approved" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-2 text-white/40 text-xs">
                      {v.reviewed_at ? new Date(v.reviewed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-white/30 text-xs">
            Approved championship/postseason/award updates feed the next weekly ranking refresh —{" "}
            <Link href="/admin/rankings" className="text-[#FDDD58]/70 hover:text-[#FDDD58]">recompute rankings →</Link>
          </p>
        </section>
      )}
    </div>
  );
}

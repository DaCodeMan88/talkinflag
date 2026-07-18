import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import ApproveRejectButtons from "./ApproveRejectButtons";

export const metadata = { title: "Scout Applications | Admin" };

export default async function AdminScoutsPage() {
  if (!(await getAdminUser())) redirect("/");
  const supabase = createAdminClient();

  const { data: apps } = await supabase
    .from("scout_applications")
    .select("*")
    .order("created_at", { ascending: false });

  const pending = (apps ?? []).filter((a) => a.status === "pending");
  const reviewed = (apps ?? []).filter((a) => a.status !== "pending");

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <h1 className="font-display text-4xl uppercase text-brand-white leading-none">Scout Applications</h1>
          <p className="text-brand-white/40 mt-2 text-sm">{pending.length} pending</p>
        </div>

        {pending.length === 0 && (
          <p className="text-brand-white/30 text-sm mb-10">No pending applications.</p>
        )}

        <div className="space-y-4 mb-12">
          {pending.map((app) => (
            <div key={app.id} className="bg-[#0d0d0d] border border-brand-white/10 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-brand-white font-semibold">{app.full_name}</p>
                  <p className="text-brand-white/40 text-sm">{app.email} · {app.location}</p>
                  {app.affiliation && <p className="text-brand-white/30 text-xs mt-1">{app.affiliation}</p>}
                </div>
                <span className="text-brand-white/20 text-xs font-display uppercase tracking-widest flex-shrink-0">
                  {new Date(app.created_at).toLocaleDateString()}
                </span>
              </div>
              {app.event_history && (
                <div>
                  <p className="text-brand-white/30 text-xs font-display uppercase tracking-widest mb-1">Event History</p>
                  <p className="text-brand-white/60 text-sm">{app.event_history}</p>
                </div>
              )}
              <div>
                <p className="text-brand-white/30 text-xs font-display uppercase tracking-widest mb-1">Why Flag Football</p>
                <p className="text-brand-white/60 text-sm">{app.why_flag}</p>
              </div>
              <ApproveRejectButtons applicationId={app.id} />
            </div>
          ))}
        </div>

        {reviewed.length > 0 && (
          <>
            <h2 className="font-display text-lg uppercase text-brand-white/30 mb-4">Reviewed</h2>
            <div className="space-y-2">
              {reviewed.map((app) => (
                <div key={app.id} className="bg-[#0d0d0d] border border-brand-white/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-brand-white/60 text-sm">{app.full_name} · {app.email}</p>
                    <p className="text-brand-white/30 text-xs">{app.location}</p>
                  </div>
                  <span className={`text-xs font-display uppercase tracking-widest px-3 py-1 border ${
                    app.status === "approved"
                      ? "border-brand-yellow/40 text-brand-yellow"
                      : "border-red-500/30 text-red-400"
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

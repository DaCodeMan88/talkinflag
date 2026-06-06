import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CoachApproveRejectButtons from "./ApproveRejectButtons";

export const metadata = { title: "Coach Applications | Admin" };

export default async function AdminCoachesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const adminEmails = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "").split(",").map((e) => e.trim());
  if (!adminEmails.includes(user.email ?? "")) redirect("/dashboard");

  const { data: coaches } = await supabase
    .from("coaches")
    .select("id, first_name, last_name, email, team, level, title, bio, years_coaching, status, created_at")
    .order("created_at", { ascending: false });

  const pending = (coaches ?? []).filter((c) => c.status === "pending");
  const reviewed = (coaches ?? []).filter((c) => c.status !== "pending");

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-10">
          <div className="border-l-4 border-brand-yellow pl-6">
            <Link href="/admin/verifications" className="text-brand-white/30 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors block mb-3">
              ← Verifications
            </Link>
            <h1 className="font-display text-4xl uppercase text-brand-white leading-none">Coach Applications</h1>
            <p className="text-brand-white/40 mt-2 text-sm">{pending.length} pending</p>
          </div>
          <Link href="/admin/scouts" className="text-brand-yellow/60 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors">
            Scouts →
          </Link>
        </div>

        {pending.length === 0 && (
          <p className="text-brand-white/30 text-sm mb-10">No pending applications.</p>
        )}

        <div className="space-y-4 mb-12">
          {pending.map((coach) => (
            <div key={coach.id} className="bg-[#0d0d0d] border border-brand-white/10 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-brand-white font-semibold">{coach.first_name} {coach.last_name}</p>
                  <p className="text-brand-white/40 text-sm">{coach.email}</p>
                  <p className="text-brand-yellow text-xs font-display uppercase tracking-widest mt-1">
                    {coach.team} · {coach.level?.replace(/_/g, " ")}
                    {coach.title && ` · ${coach.title}`}
                  </p>
                </div>
                <span className="text-brand-white/20 text-xs font-display uppercase tracking-widest flex-shrink-0">
                  {new Date(coach.created_at).toLocaleDateString()}
                </span>
              </div>
              {coach.years_coaching && (
                <p className="text-brand-white/40 text-xs">{coach.years_coaching} years coaching</p>
              )}
              {coach.bio && (
                <div>
                  <p className="text-brand-white/30 text-xs font-display uppercase tracking-widest mb-1">Bio</p>
                  <p className="text-brand-white/60 text-sm leading-relaxed">{coach.bio}</p>
                </div>
              )}
              <CoachApproveRejectButtons coachId={coach.id} />
            </div>
          ))}
        </div>

        {reviewed.length > 0 && (
          <>
            <h2 className="font-display text-lg uppercase text-brand-white/30 mb-4">Reviewed</h2>
            <div className="space-y-2">
              {reviewed.map((coach) => (
                <div key={coach.id} className="bg-[#0d0d0d] border border-brand-white/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-brand-white/60 text-sm">{coach.first_name} {coach.last_name} · {coach.team}</p>
                    <p className="text-brand-white/30 text-xs">{coach.email}</p>
                  </div>
                  <span className={`text-xs font-display uppercase tracking-widest px-3 py-1 border ${
                    coach.status === "approved"
                      ? "border-brand-yellow/40 text-brand-yellow"
                      : "border-red-500/30 text-red-400"
                  }`}>
                    {coach.status}
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

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { getAdminUser } from "@/lib/admin";
import GuidedTour from "@/components/onboarding/GuidedTour";
import ShowAroundButton from "@/components/onboarding/ShowAroundButton";
import { adminTourSteps } from "@/components/onboarding/steps";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ tour?: string }>;
}) {
  if (!(await getAdminUser())) redirect("/");
  const { tour } = await searchParams;
  const supabase = await createClient();

  const [
    { count: pendingVerifications },
    { count: pendingCoaches },
    { count: pendingScouts },
    { count: pendingHighlights },
    { count: pendingEvents },
    { count: unreadMessages },
  ] = await Promise.all([
    supabase
      .from("stat_verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("coaches")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("scout_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("highlight_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", false)
      .is("rejected_at", null),
    supabase
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .is("archived_at", null),
  ]);

  // career_updates + profile_reports + pending player registrations are RLS-locked
  // (no policy) → count via the service-role client.
  const adminDb = createAdminClient();
  const [{ count: pendingCareer }, { count: openReports }, { count: pendingPlayers }] = await Promise.all([
    adminDb.from("career_updates").select("id", { count: "exact", head: true }).eq("status", "pending"),
    adminDb.from("profile_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    adminDb.from("players").select("id", { count: "exact", head: true }).eq("is_approved", false),
  ]);

  const sections: { label: string; description: string; href: string; count: number; tour?: string }[] = [
    {
      label: "Players",
      description: "Add, edit, verify, or remove any athlete",
      href: "/admin/players",
      count: pendingPlayers ?? 0,
      tour: "admin-players",
    },
    {
      label: "Messages",
      description: "Contact-form inbox",
      href: "/admin/messages",
      count: unreadMessages ?? 0,
      tour: "admin-messages",
    },
    {
      label: "Verifications",
      description: "Player stat verification requests",
      href: "/admin/verifications",
      count: pendingVerifications ?? 0,
      tour: "admin-queues",
    },
    {
      label: "Coaches",
      description: "Coach profile applications",
      href: "/admin/coaches",
      count: pendingCoaches ?? 0,
    },
    {
      label: "Scouts",
      description: "Scout access applications",
      href: "/admin/scouts",
      count: pendingScouts ?? 0,
    },
    {
      label: "Highlights",
      description: "Top 10 Plays — review & publish",
      href: "/admin/highlights",
      count: pendingHighlights ?? 0,
    },
    {
      label: "Event Submissions",
      description: "Submitted events — review & publish",
      href: "/admin/events",
      count: pendingEvents ?? 0,
    },
    {
      label: "Featured Athlete",
      description: "Athlete Profile of the Week",
      href: "/admin/featured",
      count: 0,
    },
    {
      label: "Career Updates",
      description: "Championships, postseason, role changes, clinics",
      href: "/admin/credentials",
      count: pendingCareer ?? 0,
    },
    {
      label: "Recent Claims",
      description: "Audit log of profile claims + admin releases",
      href: "/admin/claims",
      count: 0,
    },
    {
      label: "Reports",
      description: "Profiles flagged by visitors as wrongly claimed",
      href: "/admin/reports",
      count: openReports ?? 0,
    },
    {
      label: "TF Rankings",
      description: "Recompute player rankings (poll weights + verified stats)",
      href: "/admin/rankings",
      count: 0,
      tour: "admin-rankings",
    },
  ];

  const totalPending = (pendingVerifications ?? 0) + (pendingCoaches ?? 0) + (pendingScouts ?? 0) + (pendingHighlights ?? 0) + (pendingEvents ?? 0) + (unreadMessages ?? 0) + (pendingCareer ?? 0) + (openReports ?? 0) + (pendingPlayers ?? 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <GuidedTour tourId="admin" steps={adminTourSteps} autoStart={tour === "1"} />
      <div className="flex items-start justify-between mb-10">
        <div className="border-l-4 border-[#FDDD58] pl-6">
          <h1 className="font-display text-4xl uppercase text-white leading-none">Admin</h1>
          <p className="text-white/40 mt-2 text-sm">
            {totalPending === 0 ? "All clear — no pending items." : `${totalPending} item${totalPending === 1 ? "" : "s"} pending review`}
          </p>
        </div>
        <ShowAroundButton tourId="admin" className="text-white/40 text-xs font-display uppercase tracking-widest hover:text-[#FDDD58] transition-colors shrink-0 mt-1" />
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            data-tour={s.tour}
            className="flex items-center justify-between bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors p-5 group"
          >
            <div>
              <p className="font-display text-lg uppercase text-white group-hover:text-[#FDDD58] transition-colors tracking-wide">
                {s.label}
              </p>
              <p className="text-white/30 text-xs mt-0.5">{s.description}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0 ml-4">
              {s.count > 0 ? (
                <span className="bg-[#FDDD58] text-black font-display text-sm px-3 py-1 uppercase tracking-widest">
                  {s.count} pending
                </span>
              ) : (
                <span className="text-white/20 font-display text-xs uppercase tracking-widest">✓ Clear</span>
              )}
              <span className="text-white/20 group-hover:text-[#FDDD58] transition-colors">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

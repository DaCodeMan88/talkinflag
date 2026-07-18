import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import SignOutButton from "./SignOutButton";
import { HighlightSubmitForm } from "./HighlightSubmitForm";
import MemberInsightsCard from "@/components/dashboard/MemberInsightsCard";
import GuidedTour from "@/components/onboarding/GuidedTour";
import OnboardingChecklist, { type ChecklistItem } from "@/components/onboarding/OnboardingChecklist";
import { memberTourSteps } from "@/components/onboarding/steps";
import { createAdminClient } from "@/lib/eval/admin-client";

export const metadata = buildMetadata({
  title: "Dashboard | Talkin Flag",
  description: "Manage your Talkin Flag player profile.",
  path: "/dashboard",
});

function completionScore(player: Record<string, unknown>, stats: Record<string, unknown>): number {
  const fields = [
    player.photo_url,
    player.bio,
    player.instagram,
    player.highlight_url,
    player.height_in,
    player.weight_lbs,
    stats.forty_yard,
    stats.occupation,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function missingFields(player: Record<string, unknown>, stats: Record<string, unknown>): string[] {
  const missing: string[] = [];
  if (!player.photo_url) missing.push("Add photo");
  if (!player.bio) missing.push("Write bio");
  if (!player.instagram) missing.push("Add Instagram");
  if (!player.height_in) missing.push("Add height");
  if (!stats.forty_yard) missing.push("Add 40-yard");
  return missing.slice(0, 3);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string; claimedCoach?: string; tour?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const { claimed, claimedCoach, tour } = await searchParams;

  const db = createAdminClient();

  const [{ data: player, error: playerErr }, { data: coachApp }] = await Promise.all([
    db
      .from("players")
      .select("id, first_name, last_name, position, level, photo_url, bio, instagram, highlight_url, height_in, weight_lbs, stats, school_or_team, country, is_verified, claim_pending")
      .eq("claimed_by", user.id)
      .eq("is_claimed", true)
      .maybeSingle(),
    supabase
      .from("coaches")
      .select("id, status, is_verified, first_name, last_name, team")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  if (playerErr) console.error("Dashboard player query failed:", playerErr.message);

  const stats = (player?.stats ?? {}) as Record<string, unknown>;
  const pct = player ? completionScore(player as Record<string, unknown>, stats) : 0;
  const missing = player ? missingFields(player as Record<string, unknown>, stats) : [];

  // National team coach matching — only if player has a country set
  let nationalCoaches: { id: string; first_name: string; last_name: string; team: string | null; title: string | null }[] = [];
  if (player?.country) {
    const { data: matched } = await supabase
      .from("coaches")
      .select("id, first_name, last_name, team, title")
      .eq("is_verified", true)
      .eq("level", "national")
      .ilike("team", `%${player.country}%`);
    nationalCoaches = matched ?? [];
  }

  let weeklyViews = 0;
  if (player) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("coach_profile_views")
      .select("id", { count: "exact", head: true })
      .eq("player_id", player.id)
      .gte("last_viewed_at", sevenDaysAgo);
    weeklyViews = count ?? 0;
  }

  // Onboarding checklist — derived from real account state.
  const [{ data: evalRow }, { data: iqRow }, { data: iqCoachRow }] = await Promise.all([
    db.from("eval_responses").select("id").eq("user_id", user.id).limit(1).maybeSingle(),
    db.from("iq_best").select("score_pct").eq("user_id", user.id).eq("category", "general").maybeSingle(),
    db.from("iq_best").select("score_pct").eq("user_id", user.id).eq("category", "coach").maybeSingle(),
  ]);

  // A coach-only account (has a coach profile, no player profile) gets a
  // coach-relevant checklist instead of the player onboarding steps.
  const isCoachOnly = !!coachApp && !player;

  const checklist: ChecklistItem[] = isCoachOnly
    ? [
        { label: "Claim your coach profile", done: true, href: `/coaches/${coachApp!.id}`, cta: "View", doneHref: `/coaches/${coachApp!.id}`, doneCta: "View" },
        iqCoachRow
          ? { label: "Take the Coach IQ quiz", done: true, href: "/iq/coach", cta: "Start", doneHref: "/iq/coach", doneCta: "Retake" }
          : { label: "Take the Coach IQ quiz", done: false, href: "/iq/coach", cta: "Start" },
        evalRow
          ? { label: "Map your Evaluation Lens", done: true, href: "/evaluate/results", cta: "View", doneHref: "/evaluate/results", doneCta: "View results" }
          : { label: "Map your Evaluation Lens", done: false, href: "/evaluate", cta: "Start" },
        { label: "Take the Flag IQ quiz", done: !!iqRow, href: "/iq/general", cta: "Start" },
      ]
    : [
        player
          ? { label: "Your player profile", done: true, href: `/players/${player.id}`, cta: "View", doneHref: `/players/${player.id}`, doneCta: "View" }
          : { label: "Find & claim your player profile", done: false, href: "/players", cta: "Find" },
        { label: "Complete your profile (80%+)", done: !!player && pct >= 80, href: "/dashboard/edit", cta: "Edit" },
        evalRow
          ? { label: "Take the Athlete Evaluation", done: true, href: "/evaluate/results", cta: "View", doneHref: "/evaluate/results", doneCta: "View results" }
          : { label: "Take the Athlete Evaluation", done: false, href: "/evaluate", cta: "Start" },
        { label: "Take the Flag IQ quiz", done: !!iqRow, href: "/iq/general", cta: "Start" },
        { label: "Submit a stat for verification", done: !!player?.is_verified, href: "/dashboard/verify", cta: "Submit" },
      ];

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <GuidedTour tourId="member" steps={memberTourSteps} autoStart={tour === "1"} />
      <div className="max-w-2xl mx-auto">

        <div className="flex items-start justify-between mb-10">
          <div className="border-l-4 border-brand-yellow pl-6">
            <h1 className="font-display text-4xl uppercase text-brand-white leading-none">
              Dashboard
            </h1>
            <p className="text-brand-white/40 mt-2 text-sm">{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        <OnboardingChecklist items={checklist} />
        <div className="h-4" />

        {claimed && player?.claim_pending && (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 mb-8 text-brand-yellow text-sm leading-relaxed">
            <span className="font-display uppercase tracking-widest">Profile claimed — pending review.</span>{" "}
            <span className="text-brand-yellow/70">Our team will verify it shortly. Editing unlocks once it&apos;s approved.</span>
          </div>
        )}

        {claimed && player && !player.claim_pending && (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 mb-8 text-brand-yellow text-sm font-display uppercase tracking-widest">
            Profile claimed successfully!
          </div>
        )}

        {claimedCoach && (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 mb-8 text-brand-yellow text-sm leading-relaxed">
            <span className="font-display uppercase tracking-widest">Coach profile claimed — pending review.</span>{" "}
            <span className="text-brand-yellow/70">Our team will verify it shortly and restore your verified badge.</span>
          </div>
        )}

        <div data-tour="insights">
          <MemberInsightsCard userId={user.id} />
        </div>

        {player && player.claim_pending ? (
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl uppercase text-brand-white">Your Profile</h2>
              <span className="text-xs font-display uppercase tracking-widest px-3 py-1 border border-brand-white/20 text-brand-white/40">
                Pending Review
              </span>
            </div>
            <p className="text-brand-white/60 text-sm">
              {player.first_name} {player.last_name}
              {player.school_or_team ? ` · ${player.school_or_team}` : ""}
            </p>
            <p className="text-brand-white/30 text-xs leading-relaxed">
              Your claim is with our team for verification — this protects athletes from impersonation.
              We&apos;ll email you once it&apos;s approved, and editing, stat submissions, and your public
              &ldquo;Claimed&rdquo; badge unlock then.
            </p>
          </div>
        ) : player ? (
          <div className="space-y-4">
            {/* Profile card */}
            <div data-tour="profile" className="bg-[#0d0d0d] border border-brand-white/10 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl uppercase text-brand-white">Your Profile</h2>
                <span className="border border-brand-yellow/40 text-brand-yellow text-xs px-3 py-1 font-display uppercase tracking-widest">
                  ✓ Claimed
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  {player.photo_url ? (
                    <Image
                      src={player.photo_url}
                      alt={`${player.first_name} ${player.last_name}`}
                      fill
                      className="rounded-full object-cover border-2 border-brand-yellow/30"
                      unoptimized
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-brand-yellow/10 border-2 border-brand-yellow/20 flex items-center justify-center">
                      <span className="font-display text-xl text-brand-yellow">
                        {player.first_name[0]}{player.last_name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-brand-white font-semibold text-lg">
                    {player.first_name} {player.last_name}
                  </p>
                  <p className="text-brand-white/40 text-sm">
                    {player.position} · {player.school_or_team}
                  </p>
                </div>
              </div>

              {/* Completion bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-display uppercase tracking-widest text-brand-white/30">
                    Profile Complete
                  </span>
                  <span className="text-xs font-display text-brand-yellow">{pct}%</span>
                </div>
                <div className="h-1 bg-brand-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-yellow transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {missing.length > 0 && (
                  <p className="text-brand-white/25 text-xs mt-2">
                    {missing.join(" · ")}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-1">
                <Link
                  href="/dashboard/edit"
                  className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors"
                >
                  Edit Profile
                </Link>
                <Link
                  href={`/players/${player.id}`}
                  className="text-brand-white/40 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
                >
                  View Public Profile →
                </Link>
              </div>
            </div>

            {/* Coach views this week */}
            <div className="bg-[#0d0d0d] border border-brand-white/10 p-5 flex items-center justify-between">
              <div>
                <p className="text-brand-white/60 text-sm font-display uppercase tracking-widest">
                  Coach Interest
                </p>
                <p className="text-brand-white/25 text-xs mt-1">
                  {weeklyViews === 0
                    ? "No coach views yet this week"
                    : weeklyViews === 1
                    ? "1 coach viewed your profile this week"
                    : `${weeklyViews} coaches viewed your profile this week`}
                </p>
              </div>
              <span className="font-display text-2xl text-brand-yellow">{weeklyViews}</span>
            </div>

            {/* Verification */}
            <div data-tour="verify" className="bg-[#0d0d0d] border border-brand-white/10 p-5 flex items-center justify-between">
              <div>
                <p className="text-brand-white/60 text-sm font-display uppercase tracking-widest">
                  Stat Verification
                </p>
                <p className="text-brand-white/25 text-xs mt-1">
                  Earn the ✓ Verified badge on your measurables
                </p>
              </div>
              <Link
                href="/dashboard/verify"
                className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
              >
                Submit →
              </Link>
            </div>

            {/* Career updates */}
            <div className="bg-[#0d0d0d] border border-brand-white/10 p-5 flex items-center justify-between">
              <div>
                <p className="text-brand-white/60 text-sm font-display uppercase tracking-widest">
                  Career Updates
                </p>
                <p className="text-brand-white/25 text-xs mt-1">
                  New title, postseason run, role change, or clinic
                </p>
              </div>
              <Link
                href="/dashboard/credentials"
                className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
              >
                Add →
              </Link>
            </div>

            {/* Following */}
            <div className="bg-[#0d0d0d] border border-brand-white/10 p-5 flex items-center justify-between">
              <div>
                <p className="text-brand-white/60 text-sm font-display uppercase tracking-widest">
                  Following
                </p>
                <p className="text-brand-white/25 text-xs mt-1">
                  Players and coaches you follow
                </p>
              </div>
              <Link
                href="/dashboard/following"
                className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
              >
                View →
              </Link>
            </div>

            {/* Highlight submission */}
            <HighlightSubmitForm playerId={player.id} />

            {/* Coach status */}
            {coachApp ? (
              <div className="bg-[#0d0d0d] border border-brand-white/10 p-5 flex items-center justify-between">
                <div>
                  <p className="text-brand-white/60 text-sm font-display uppercase tracking-widest">
                    Coach Status
                  </p>
                  <p className="text-brand-white/25 text-xs mt-1">
                    {coachApp.first_name} {coachApp.last_name} · {coachApp.team}
                  </p>
                </div>
                {coachApp.is_verified ? (
                  <Link
                    href="/dashboard/recruiting"
                    className="border border-brand-yellow/40 text-brand-yellow text-xs font-display uppercase tracking-widest px-3 py-1 hover:bg-brand-yellow hover:text-brand-black transition-colors"
                  >
                    ✓ Verified
                  </Link>
                ) : (
                  <span className={`text-xs font-display uppercase tracking-widest px-3 py-1 border ${
                    coachApp.status === "rejected"
                      ? "border-red-500/30 text-red-400"
                      : "border-brand-white/20 text-brand-white/40"
                  }`}>
                    {coachApp.status === "rejected" ? "Not Approved" : "Pending Review"}
                  </span>
                )}
              </div>
            ) : (
              <div className="bg-[#0d0d0d] border border-brand-white/10 p-5 flex items-center justify-between">
                <div>
                  <p className="text-brand-white/60 text-sm font-display uppercase tracking-widest">
                    Are you a coach?
                  </p>
                  <p className="text-brand-white/25 text-xs mt-1">
                    Apply for verified coach status
                  </p>
                </div>
                <Link
                  href="/coaches/apply"
                  className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
                >
                  Apply →
                </Link>
              </div>
            )}
            {/* International Opportunity */}
            {nationalCoaches.length > 0 && (
              <div className="bg-[#0d0d0d] border border-brand-yellow/30 p-5">
                <p className="text-brand-yellow text-sm font-display uppercase tracking-widest mb-1">
                  International Opportunity
                </p>
                <p className="text-brand-white/40 text-xs mb-4">
                  Your nationality qualifies you for these national team programs
                </p>
                <div className="space-y-3">
                  {nationalCoaches.map((coach) => (
                    <div key={coach.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-brand-white text-sm font-semibold">
                          {coach.first_name} {coach.last_name}
                        </p>
                        {coach.team && (
                          <p className="text-brand-white/40 text-xs">{coach.team}</p>
                        )}
                        {coach.title && (
                          <p className="text-brand-white/25 text-xs">{coach.title}</p>
                        )}
                      </div>
                      <Link
                        href={`/coaches/${coach.id}`}
                        className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors shrink-0 ml-4"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : coachApp ? (
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl uppercase text-brand-white">Your Coach Profile</h2>
              {coachApp.is_verified ? (
                <span className="border border-brand-yellow/40 text-brand-yellow text-xs px-3 py-1 font-display uppercase tracking-widest">
                  ✓ Verified
                </span>
              ) : (
                <span className={`text-xs font-display uppercase tracking-widest px-3 py-1 border ${
                  coachApp.status === "rejected"
                    ? "border-red-500/30 text-red-400"
                    : "border-brand-white/20 text-brand-white/40"
                }`}>
                  {coachApp.status === "rejected" ? "Not Approved" : "Pending Review"}
                </span>
              )}
            </div>
            <p className="text-brand-white/60 text-sm">
              {coachApp.first_name} {coachApp.last_name} · {coachApp.team}
            </p>
            {coachApp.is_verified ? (
              <Link
                href="/dashboard/recruiting"
                className="inline-block bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors"
              >
                Coach Dashboard →
              </Link>
            ) : (
              <p className="text-brand-white/30 text-xs">
                {coachApp.status === "rejected"
                  ? "This claim wasn't approved. Contact us at talkinflagshow@gmail.com if you believe this is an error."
                  : "Your claim is with our team for verification. We'll email you once it's approved."}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-8 text-center space-y-4">
            <div className="text-4xl">🏈</div>
            <p className="text-brand-white/60 text-sm">
              No player profile linked to your account yet.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/players"
                className="inline-block bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors"
              >
                Find Your Profile
              </Link>
              <Link
                href="/players/submit"
                className="text-brand-white/40 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
              >
                Create a New Profile →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

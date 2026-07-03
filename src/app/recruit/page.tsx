import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import RecruitBrowser from "./RecruitBrowser";
import RosterSpotsBoard from "./RosterSpotsBoard";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Recruiting | Talkin Flag — Flag Football Player Marketplace",
  description: "Connect high school and college flag football players with verified coaches. Browse recruiting profiles, post roster openings, express interest.",
  path: "/recruit",
});

export default async function RecruitPage() {
  const supabase = await createClient();
  const publicSupabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  let viewerCoach: { id: string; first_name: string; team: string } | null = null;
  let viewerPlayer: { id: string } | null = null;
  let myInterests: string[] = [];
  let myNotes: Record<string, string> = {};

  if (user) {
    const [{ data: coach }, { data: player }] = await Promise.all([
      supabase.from("coaches").select("id, first_name, team").eq("user_id", user.id).eq("is_verified", true).single(),
      supabase.from("players").select("id").eq("claimed_by", user.id).eq("is_claimed", true).single(),
    ]);
    viewerCoach = coach ?? null;
    viewerPlayer = player ?? null;

    if (viewerCoach) {
      const [{ data: interests }, { data: notes }] = await Promise.all([
        supabase.from("recruiting_interests").select("player_id").eq("coach_id", viewerCoach.id),
        supabase.from("coach_player_notes").select("player_id, note").eq("coach_id", viewerCoach.id),
      ]);
      myInterests = (interests ?? []).map((r) => r.player_id as string);
      myNotes = Object.fromEntries((notes ?? []).map((r) => [r.player_id as string, r.note as string]));
    }
  }

  const { data: players } = await publicSupabase
    .from("players")
    .select("id, first_name, last_name, position, level, school_or_team, city, state, country, country_code, grad_year, photo_url, height_in, weight_lbs, stats, recruiting_targets, is_verified, is_claimed, created_at")
    .eq("recruiting_open", true)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: spots } = await publicSupabase
    .from("coach_roster_spots")
    .select("id, position, target_grad_year, state_pref, description, created_at, coach_id, coaches(first_name, last_name, team, level)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const playerList = (players ?? []) as Array<{
    id: string; first_name: string; last_name: string; position?: string | null;
    level?: string | null; school_or_team?: string | null; city?: string | null;
    state?: string | null; country?: string | null; country_code?: string | null;
    grad_year?: number | null; photo_url?: string | null; height_in?: number | null;
    weight_lbs?: number | null; stats?: Record<string, unknown> | null;
    recruiting_targets?: string[] | null; is_verified?: boolean; is_claimed?: boolean;
    created_at?: string;
  }>;

  const spotList = (spots ?? []) as unknown as Array<{
    id: string; position: string | null; target_grad_year: number | null;
    state_pref: string | null; description: string | null; created_at: string;
    coaches: { first_name: string; last_name: string; team: string; level: string };
  }>;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const newPlayerIds = playerList
    .filter((p) => p.created_at && p.created_at > sevenDaysAgo)
    .map((p) => p.id);

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-start justify-between gap-4 mb-12">
          <div className="border-l-4 border-brand-yellow pl-6">
            <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white leading-none">Recruiting</h1>
            <p className="mt-3 text-brand-white/60 max-w-xl">
              {viewerCoach
                ? `Welcome, ${viewerCoach.first_name}. Browse players open to recruiting and post your open spots.`
                : viewerPlayer
                ? "Toggle recruiting on your profile to connect with coaches."
                : "The flag football recruiting marketplace. Players opt in. Coaches connect directly."}
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0 mt-1">
            {viewerPlayer && (
              <Link href="/dashboard" className="border border-brand-yellow/40 text-brand-yellow font-display text-xs uppercase tracking-widest px-4 py-2 hover:bg-brand-yellow hover:text-brand-black transition-colors text-center">
                Manage Profile →
              </Link>
            )}
            {viewerCoach && (
              <Link href="/dashboard/recruiting" className="border border-brand-yellow/40 text-brand-yellow font-display text-xs uppercase tracking-widest px-4 py-2 hover:bg-brand-yellow hover:text-brand-black transition-colors text-center">
                My Pipeline →
              </Link>
            )}
            {!user && (
              <Link href="/auth/login?next=/recruit" className="border border-brand-white/20 text-brand-white/60 font-display text-xs uppercase tracking-widest px-4 py-2 hover:border-brand-yellow/40 hover:text-brand-yellow transition-colors text-center">
                Sign In
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Player browse — 2/3 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl uppercase text-brand-white">
                Open to Recruiting
                <span className="ml-3 text-brand-white/30 text-sm normal-case tracking-normal font-sans">
                  {playerList.length} players
                </span>
              </h2>
            </div>
            {playerList.length === 0 ? (
              <div className="border border-brand-white/10 p-10 text-center space-y-3">
                <p className="text-brand-white/40 text-sm">No players have opened recruiting yet.</p>
                {viewerPlayer && (
                  <Link href="/dashboard" className="inline-block text-brand-yellow text-xs font-display uppercase tracking-widest hover:underline">
                    Open your recruiting profile →
                  </Link>
                )}
              </div>
            ) : (
              <RecruitBrowser
                players={playerList}
                isCoach={!!viewerCoach}
                coachId={viewerCoach?.id ?? null}
                initialInterests={myInterests}
                initialNotes={myNotes}
                newPlayerIds={newPlayerIds}
              />
            )}
          </div>

          {/* Roster spots — 1/3 */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl uppercase text-brand-white">Open Spots</h2>
              {viewerCoach && (
                <Link href="/dashboard/recruiting#post-spot" className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors">
                  + Post →
                </Link>
              )}
            </div>
            <RosterSpotsBoard spots={spotList} isPlayer={!!viewerPlayer} />
          </div>
        </div>

        {!viewerCoach && !viewerPlayer && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-brand-white/10 p-8 text-center space-y-3">
              <p className="font-display text-lg uppercase text-brand-white">Are you a player?</p>
              <p className="text-brand-white/40 text-sm">Claim your profile and toggle recruiting to connect with coaches.</p>
              <Link href="/players" className="inline-block text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline">Find Your Profile →</Link>
            </div>
            <div className="border border-brand-yellow/20 p-8 text-center space-y-3">
              <p className="font-display text-lg uppercase text-brand-white">Are you a coach?</p>
              <p className="text-brand-white/40 text-sm">Apply for verified coach status to express interest in players.</p>
              <Link href="/coaches/apply" className="inline-block bg-brand-yellow text-brand-black font-display text-xs uppercase tracking-widest py-2 px-5 hover:bg-brand-yellow/90 transition-colors">
                Apply for Verification →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

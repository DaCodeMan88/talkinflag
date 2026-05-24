import { createServerClient } from "@/lib/supabase";
import { PlayerCard } from "@/components/players/PlayerCard";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import type { Player } from "@/types/player";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Recruit Players | Talkin Flag — Find Elite Flag Football Talent",
  description:
    "Browse the Talkin Flag global player database. Connect with verified flag football athletes across all levels — high school, college, national, and pro.",
  path: "/recruit",
});

export default async function RecruitPage() {
  const supabase = createServerClient();

  // Fetch top-ranked verified players for the showcase
  const { data: topPlayers } = await supabase
    .from("players")
    .select("*")
    .eq("is_verified", true)
    .not("ranking_national", "is", null)
    .order("ranking_national", { ascending: true })
    .limit(8) as { data: Player[] | null };

  // Fallback: if no ranked players, show any verified players
  const { data: fallbackPlayers } = !topPlayers?.length
    ? await supabase
        .from("players")
        .select("*")
        .eq("is_verified", true)
        .limit(8) as { data: Player[] | null }
    : { data: null };

  const showcase = topPlayers?.length ? topPlayers : (fallbackPlayers ?? []);

  return (
    <div className="min-h-screen bg-brand-black">
      {/* Hero */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-yellow/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <p className="font-display text-brand-yellow text-xs uppercase tracking-[0.3em] mb-6">
            For Coaches &amp; Scouts
          </p>
          <h1 className="font-display text-6xl md:text-8xl uppercase text-brand-white leading-none mb-6">
            Find Elite<br />
            <span className="text-brand-yellow">Flag Football</span><br />
            Talent
          </h1>
          <p className="text-brand-white/60 text-lg max-w-xl mb-10 leading-relaxed">
            The Talkin Flag player database connects coaches and scouts with verified
            athletes from around the world — complete with highlight videos, stats,
            and contact information.
          </p>

          <Link
            href="/players"
            className="inline-flex items-center gap-3 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-400 transition-colors"
          >
            Browse Full Database
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-brand-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl uppercase text-brand-white mb-12 text-center">
            What You Get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Global Database",
                body: "Athletes from the US, Europe, Latin America, and beyond. Flag football is worldwide — so is our database.",
              },
              {
                title: "Verified Profiles",
                body: "Every player is manually reviewed before appearing. No bots, no fake profiles — just real talent.",
              },
              {
                title: "Highlight Videos",
                body: "Watch players in action before reaching out. Every profile links directly to game film and highlight reels.",
              },
            ].map((feat) => (
              <div key={feat.title} className="border border-brand-white/10 bg-[#111111] p-6">
                <div className="w-8 h-1 bg-brand-yellow mb-4" />
                <h3 className="font-display text-xl uppercase text-brand-white mb-3">{feat.title}</h3>
                <p className="text-brand-white/60 text-sm leading-relaxed">{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Players Showcase */}
      {showcase.length > 0 && (
        <section className="py-20 px-4 border-t border-brand-white/10 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="font-display text-brand-yellow text-xs uppercase tracking-[0.3em] mb-2">
                  Currently Listed
                </p>
                <h2 className="font-display text-3xl md:text-4xl uppercase text-brand-white">
                  {topPlayers?.length ? "Top Ranked Players" : "Featured Players"}
                </h2>
              </div>
              <Link
                href="/players"
                className="text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline hidden md:block"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {showcase.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/players" className="text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline">
                View All Players →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Stats strip */}
      <section className="py-14 px-4 bg-brand-yellow">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "Global", label: "Player Coverage" },
            { value: "48hr", label: "Review Turnaround" },
            { value: "Free", label: "Always Free to Browse" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-4xl md:text-5xl uppercase text-brand-black leading-none">{stat.value}</p>
              <p className="text-brand-black/60 text-xs uppercase tracking-widest mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Player CTA */}
      <section className="py-24 px-4 border-t border-brand-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-display text-brand-yellow text-xs uppercase tracking-[0.3em] mb-4">
            Are You a Player?
          </p>
          <h2 className="font-display text-4xl md:text-5xl uppercase text-brand-white mb-4">
            Get Discovered
          </h2>
          <p className="text-brand-white/60 mb-8 max-w-lg mx-auto leading-relaxed">
            Submit your player profile and get in front of college coaches, national
            team selectors, and scouts worldwide. It&apos;s completely free.
          </p>
          <Link
            href="/players/submit"
            className="inline-flex items-center gap-3 border-2 border-brand-yellow text-brand-yellow font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-brand-yellow hover:text-brand-black transition-colors"
          >
            Submit Your Profile
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

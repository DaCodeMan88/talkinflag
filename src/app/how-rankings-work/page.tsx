import { safeJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import { DIMENSION_LABELS, type DimensionKey } from "@/lib/eval/dimensions";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "How Rankings Work | Talkin Flag",
  description:
    "How Talkin Flag sources its player database, verifies athletes, and calculates the TF Rank — a community-weighted performance rating built on Coaches, Experts, and Hosts poll data.",
  path: "/how-rankings-work",
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://talkinflag.com" },
    { "@type": "ListItem", position: 2, name: "How Rankings Work", item: "https://talkinflag.com/how-rankings-work" },
  ],
};

const DIMENSIONS: { key: DimensionKey; description: string }[] = [
  { key: "competition",   description: "Level of competition — national, college, or high school (league-difficulty adjusted)." },
  { key: "production",    description: "Verified TDs, yards, and completions — league-adjusted so a national-team QB isn't penalized for playing harder defenses." },
  { key: "athleticism",   description: "40-yard dash, vertical jump, and measurable explosiveness. Falls back to competition-level proxy when not on file." },
  { key: "football_iq",   description: "Completion percentage and decision-making proxies. The metric coaches actually care about." },
  { key: "ball_skills",   description: "Passing yards + receiving volume, capturing the full offensive skill set." },
  { key: "defense",       description: "Tackles, sacks, and flag-pulls — rewarding athletes who affect both sides of the ball." },
  { key: "clutch",        description: "Championship-game stats only. Separates producers from big-game performers." },
  { key: "intangibles",   description: "Verified profile + national team selection signals — things no stat line captures." },
  { key: "versatility",   description: "Stat richness and multi-dimensional profile — the jack-of-all-trades premium." },
  { key: "consistency",   description: "Years active and multi-season production — durability matters at every level." },
];

export default async function HowRankingsWorkPage() {
  const supabase = createServerClient();

  const [{ count: totalPlayers }, { count: verifiedPlayers }, { count: rankedPlayers }] =
    await Promise.all([
      supabase.from("players").select("id", { count: "exact", head: true }),
      supabase.from("players").select("id", { count: "exact", head: true }).eq("is_verified", true),
      supabase.from("players").select("id", { count: "exact", head: true }).not("ranking_national", "is", null),
    ]);

  return (
    <div className="bg-brand-black min-h-screen pt-28 pb-24 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <div className="mb-16">
          <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-4">
            Methodology
          </p>
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white leading-none mb-6">
            How Rankings Work
          </h1>
          <p className="text-brand-white/60 text-lg leading-relaxed max-w-xl">
            MaxPreps doesn&apos;t cover flag football. IFAF publishes team standings, not player scores.
            We built the ranking system the sport needs — transparent, community-weighted,
            and powered by the people who actually understand the game.
          </p>
        </div>

        {/* Live stats strip */}
        <div className="grid grid-cols-3 gap-3 mb-14">
          {[
            { label: "Players Indexed", value: `${totalPlayers ?? 0}+` },
            { label: "Verified Profiles", value: verifiedPlayers ?? 0 },
            { label: "Currently Ranked", value: rankedPlayers ?? 0 },
          ].map((s) => (
            <div key={s.label} className="border border-brand-yellow/20 bg-[#111111] p-5 text-center">
              <p className="font-display text-3xl text-brand-yellow mb-1">{s.value}</p>
              <p className="text-brand-white/40 text-xs uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Section 1: The Database */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            The Player Database
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed mb-6">
            Every profile is sourced from one of three pipelines — no invented athletes, no padding:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: "Official Rosters",
                desc: "USA Football, IFAF, and national federation published rosters. Verified against primary sources.",
              },
              {
                label: "Public Indexes",
                desc: "Reference profiles from databases like flagsonly.com — tagged with source, marked unclaimed until an athlete verifies.",
              },
              {
                label: "Self-Submitted",
                desc: "Athletes submit their own profiles. Stats can then be verified by coaches or scouts.",
              },
            ].map((item) => (
              <div key={item.label} className="border border-brand-yellow/20 bg-[#111111] p-5">
                <p className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-2">{item.label}</p>
                <p className="text-brand-white/60 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: The Poll System */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            The Poll System
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed mb-6">
            Every user who completes the{" "}
            <Link href="/evaluate" className="text-brand-yellow hover:underline">Evaluation Philosophy questionnaire</Link>{" "}
            contributes their opinion on what matters when ranking an athlete.
            Those votes are aggregated into dimension weights per constituency:
          </p>
          <div className="space-y-3 mb-6">
            {[
              { role: "Coaches", pct: "55%", desc: "Verified coaching accounts have the largest voice. They see athletes in training and competition every week." },
              { role: "Experts", pct: "30%", desc: "Verified scouts and analysts — people with a professional eye for talent." },
              { role: "Hosts", pct: "15%", desc: "Site admins (Ambra & Tika). Their opinion grounds the system but doesn't dominate it." },
            ].map((row) => (
              <div key={row.role} className="flex gap-4 border border-brand-white/10 bg-[#111111] p-5">
                <div className="shrink-0 w-16 text-center">
                  <span className="font-display text-xl text-brand-yellow">{row.pct}</span>
                </div>
                <div>
                  <p className="font-display text-xs uppercase tracking-widest text-brand-white mb-1">{row.role}</p>
                  <p className="text-brand-white/50 text-xs leading-relaxed">{row.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-brand-white/40 text-xs border-l-2 border-brand-yellow/30 pl-4 italic">
            Blend fractions are admin-adjustable as the community grows. More verified coaches = more coaching weight.
          </p>

          {/* Coach voting influence */}
          <div className="mt-8 border border-brand-white/10 bg-[#111111] p-6">
            <h3 className="font-display text-sm uppercase tracking-widest text-brand-white mb-3">
              Not every coach&apos;s vote weighs the same
            </h3>
            <p className="text-brand-white/60 text-xs leading-relaxed mb-4">
              Within the Coaches constituency, each verified coach&apos;s vote is weighted by their
              demonstrated credibility — so a battle-tested coach who knows the game moves the
              rankings more than a brand-new account. Credibility is built from:
            </p>
            <ul className="space-y-2 text-brand-white/55 text-xs leading-relaxed mb-4">
              <li><span className="text-brand-yellow font-display uppercase tracking-widest text-[10px]">Coach IQ</span> — the primary lever. A coach must clear a minimum{" "}
                <Link href="/iq/coach" className="text-brand-yellow hover:underline">Coach IQ</Link>{" "}
                score to earn any extra influence.</li>
              <li><span className="text-brand-yellow font-display uppercase tracking-widest text-[10px]">Level</span> — national, college, or high school.</li>
              <li><span className="text-brand-yellow font-display uppercase tracking-widest text-[10px]">Win %</span> — a winning record (over a minimum number of games).</li>
              <li><span className="text-brand-yellow font-display uppercase tracking-widest text-[10px]">Experience</span> — years coaching, with diminishing returns.</li>
              <li><span className="text-brand-yellow font-display uppercase tracking-widest text-[10px]">Postseason</span> — championships, title games, and playoff runs from approved career updates.</li>
            </ul>
            <p className="text-brand-white/40 text-xs leading-relaxed">
              Influence scales from a standard <span className="text-brand-white/70">1.00×</span> up to a capped{" "}
              <span className="text-brand-white/70">2.00×</span>. A coach who hasn&apos;t taken the Coach IQ quiz
              votes at the standard weight — never penalized, just not boosted. You can see any coach&apos;s
              Coach IQ and voting influence on their profile.
            </p>
          </div>
        </section>

        {/* Section 3: The 10 Dimensions */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            The 10 Dimensions
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed mb-6">
            Each player is scored 0–10 on ten dimensions derived from their verified stats and profile.
            The poll system determines how much each dimension matters — not us.
          </p>
          <div className="space-y-2">
            {DIMENSIONS.map(({ key, description }) => (
              <div key={key} className="flex gap-4 border border-brand-white/5 bg-[#0d0d0d] px-5 py-4">
                <span className="font-display text-xs uppercase tracking-widest text-brand-yellow w-36 shrink-0">
                  {DIMENSION_LABELS[key]}
                </span>
                <p className="text-brand-white/50 text-xs leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Verification Confidence */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            The Verified Badge
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed mb-4">
            A <span className="text-brand-yellow">✓ verified badge</span> means a Talkin Flag team member
            has confirmed the athlete&apos;s identity and cross-checked their core stats against
            public sources (film, official box scores, coach confirmation).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[
              { label: "Verified",   factor: "100%", desc: "Full score weight — stats confirmed." },
              { label: "Claimed",    factor: "85%",  desc: "Profile claimed but stats not yet verified." },
              { label: "Unclaimed",  factor: "65%",  desc: "Public record — not yet confirmed by athlete." },
            ].map((row) => (
              <div key={row.label} className="border border-brand-yellow/20 bg-[#111111] p-5 text-center">
                <p className="font-display text-2xl text-brand-yellow mb-1">{row.factor}</p>
                <p className="font-display text-xs uppercase tracking-widest text-brand-white mb-2">{row.label}</p>
                <p className="text-brand-white/40 text-xs">{row.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            Athletes can claim their profile via{" "}
            <Link href="/players/submit" className="text-brand-yellow underline hover:no-underline">
              Submit Profile
            </Link>
            . Coaches and scouts can flag stats for review from any player page.
          </p>
        </section>

        {/* Section 5: The Formula */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            The Formula
          </h2>
          <div className="border border-brand-yellow/20 bg-[#0d0d0d] p-6 font-mono text-xs text-brand-white/70 leading-relaxed space-y-2">
            <p>blended_weight[dim] =</p>
            <p className="pl-6">coaches(55%) × coach_weight[dim]</p>
            <p className="pl-6">+ experts(30%) × expert_weight[dim]</p>
            <p className="pl-6">+ hosts(15%)   × host_weight[dim]</p>
            <p className="mt-3">raw_score = Σ blended_weight[dim] × player_score[dim] / max_possible × 100</p>
            <p>tf_score  = raw_score × verification_factor</p>
          </div>
          <p className="text-brand-white/40 text-xs mt-4">
            Rankings are recomputed once a week, on Sundays at 02:00 UTC, and any time an admin triggers a manual recompute.
            Snapshot history is retained in{" "}
            <code className="text-brand-yellow/60">ranking_snapshots</code>.
          </p>
        </section>

        {/* CTA */}
        <div className="border border-brand-yellow/30 bg-[#111111] p-8 text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-brand-yellow mb-3">
            Be Part of the Ranking
          </p>
          <h3 className="font-display text-2xl uppercase text-brand-white mb-5">
            Your Opinion Moves the Rankings
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/evaluate"
              className="font-display uppercase tracking-wider text-sm px-6 py-3 bg-brand-yellow text-brand-black hover:bg-yellow-400 transition-colors"
            >
              Take the Evaluation
            </Link>
            <Link
              href="/rankings"
              className="font-display uppercase tracking-wider text-sm px-6 py-3 border border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-brand-black transition-colors"
            >
              See the Rankings
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

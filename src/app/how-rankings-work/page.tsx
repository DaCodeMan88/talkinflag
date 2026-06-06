import { buildMetadata } from "@/lib/seo";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "How Rankings Work | Talkin Flag",
  description:
    "How Talkin Flag sources its player database, verifies athletes, and calculates the TF Rank — a 100-point performance rating for flag football.",
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

export default function HowRankingsWorkPage() {
  return (
    <div className="bg-brand-black min-h-screen pt-28 pb-24 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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
            The Talkin Flag player database is built from public sources, verified national team
            rosters, and self-submitted athlete profiles — indexed to give flag football the
            credible, searchable database the sport deserves.
          </p>
        </div>

        {/* Section: The Database */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            The Player Database
          </h2>
          <div className="space-y-5 text-brand-white/70 text-sm leading-relaxed">
            <p>
              Our database currently indexes <strong className="text-brand-white">374+ players</strong> across
              high school, college, and national team levels. Every profile is sourced from
              one of three pipelines:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: "Official Rosters",
                  desc: "USA Football, IFAF, and national federation published rosters. Verified against primary sources — no invented athletes.",
                },
                {
                  label: "Public Indexes",
                  desc: "Reference profiles sourced from publicly available databases like flagsonly.com, tagged with their source and marked unclaimed until an athlete verifies ownership.",
                },
                {
                  label: "Self-Submitted",
                  desc: "Athletes submit their own profiles via our Submit Profile form. Stats can be verified by coaches or scouts with a Talkin Flag account.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border border-brand-yellow/20 bg-[#111111] p-5"
                >
                  <p className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-2">
                    {item.label}
                  </p>
                  <p className="text-brand-white/60 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: TF Rank */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            The TF Rank
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed mb-6">
            The TF Rank is a 0–100 composite score designed to surface the most
            complete flag football athletes — not just the ones with the biggest social following.
            It weights three categories:
          </p>
          <div className="space-y-3 mb-8">
            {[
              {
                label: "External Recognition",
                weight: "20 pts",
                desc: "National team selections, all-conference/all-state honors, major tournament MVP awards, and media recognition.",
              },
              {
                label: "Measurable Performance",
                weight: "30 pts",
                desc: "Verified stats: passing yards, touchdowns, completion %, sacks, flag pulls, 40-yard dash, vertical. Higher verified-stat totals = higher score.",
              },
              {
                label: "Comprehensive Assessment",
                weight: "50 pts",
                desc: "Holistic evaluation by the Talkin Flag team — position versatility, film review notes, leadership indicators, and recruiting demand. Rubric defined by Ambra & Tika Marcucci.",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex gap-4 border border-brand-white/10 bg-[#111111] p-5"
              >
                <div className="flex-shrink-0 w-20 text-center">
                  <span className="font-display text-xl text-brand-yellow">{row.weight}</span>
                </div>
                <div>
                  <p className="font-display text-xs uppercase tracking-widest text-brand-white mb-1">
                    {row.label}
                  </p>
                  <p className="text-brand-white/55 text-xs leading-relaxed">{row.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-brand-white/40 text-xs italic border-l-2 border-brand-yellow/30 pl-4">
            Note: The full 100-point rubric scoring grid is currently being finalized by Ambra &amp; Tika
            Marcucci. Until the rubric is published, TF Ranks appear as provisional estimates on
            profiles that have been manually reviewed.
          </p>
        </section>

        {/* Section: Verification */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Profile Verification
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed mb-4">
            A <span className="text-brand-yellow">verified badge</span> on a profile means a
            Talkin Flag team member has confirmed the athlete's identity and
            reviewed their core stats against public sources (game film, official box scores,
            coaching confirmation).
          </p>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            Athletes can claim their profile by submitting via{" "}
            <Link href="/players/submit" className="text-brand-yellow underline hover:no-underline">
              Submit Profile
            </Link>{" "}
            and referencing the unclaimed profile. Coaches and scouts can flag stats for
            review using the verification tool on any player page.
          </p>
        </section>

        {/* CTA */}
        <div className="border border-brand-yellow/30 bg-[#111111] p-8 text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-brand-yellow mb-3">
            Explore the Database
          </p>
          <h3 className="font-display text-2xl uppercase text-brand-white mb-5">
            Find Any Player
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/players"
              className="font-display uppercase tracking-wider text-sm px-6 py-3 bg-brand-yellow text-brand-black hover:bg-yellow-400 transition-colors"
            >
              Browse Players
            </Link>
            <Link
              href="/teams"
              className="font-display uppercase tracking-wider text-sm px-6 py-3 border border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-brand-black transition-colors"
            >
              Browse Teams
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

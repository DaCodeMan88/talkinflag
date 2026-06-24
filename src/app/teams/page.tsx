import { safeJsonLd } from "@/lib/jsonld";
import { TeamsHub } from "@/components/rankings/TeamsHub";
import { buildMetadata } from "@/lib/seo";
import { createServerClient } from "@/lib/supabase";
import { COLLEGE_COMMITS } from "@/lib/world-rankings";
import Link from "next/link";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Teams | Talkin Flag — World & College Flag Football",
  description:
    "Flag football team rankings — IFAF world national team standings and NCAA college program directory.",
  path: "/teams",
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",  item: "https://talkinflag.com" },
    { "@type": "ListItem", position: 2, name: "Teams", item: "https://talkinflag.com/teams" },
  ],
};

export default async function TeamsPage() {
  const supabase = createServerClient();

  const [{ data: coaches }, { data: players }] = await Promise.all([
    supabase
      .from("coaches")
      .select("id, first_name, last_name, team, title, wins, losses")
      .eq("is_verified", true)
      .eq("level", "national"),
    supabase
      .from("players")
      .select("id, first_name, last_name, position, country, school_or_team")
      .or("level.eq.national,level.eq.international")
      .eq("is_verified", true),
  ]);

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Teams</h1>
          <p className="mt-3 text-brand-white/60">
            IFAF world national team rankings and NCAA college program directory.
          </p>
        </div>
        <TeamsHub nationalCoaches={coaches ?? []} nationalPlayers={players ?? []} />

        {/* College Commits Panel */}
        <section className="mt-16 border-t border-brand-yellow/10 pt-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-2">
                College Pipeline
              </p>
              <h2 className="font-display text-2xl md:text-3xl uppercase text-brand-white">
                D1 &amp; NAIA Commits
              </h2>
            </div>
            <Link
              href="/players?level=high_school"
              className="text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline"
            >
              View HS Players →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COLLEGE_COMMITS.map((c) => (
              <div
                key={`${c.name}-${c.commitSchool}`}
                className="border border-brand-yellow/20 bg-[#111111] p-5"
              >
                <p className="font-display text-[10px] uppercase tracking-widest text-brand-yellow mb-1">
                  {c.division} · {c.position}
                </p>
                <p className="font-display text-base uppercase text-brand-white mb-1">{c.name}</p>
                <p className="text-brand-white/50 text-xs mb-2">
                  {c.highSchool !== "TBD" ? `${c.highSchool} · ${c.state}` : ""}
                </p>
                <p className="text-brand-white/70 text-sm">
                  → <span className="text-brand-white">{c.commitSchool}</span>
                  {c.conference ? <span className="text-brand-white/40 text-xs"> ({c.conference})</span> : null}
                </p>
                {c.notes && (
                  <p className="text-brand-white/40 text-xs mt-2 leading-relaxed">{c.notes}</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-brand-white/30 text-xs mt-6">
            College commits are sourced from public announcements and official program news.{" "}
            <Link href="/how-rankings-work" className="text-brand-yellow/60 hover:text-brand-yellow">
              How we source data →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

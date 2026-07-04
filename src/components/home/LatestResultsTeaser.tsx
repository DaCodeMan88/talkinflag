import Link from "next/link";
import { createAdminClient } from "@/lib/eval/admin-client";

type ResultEvent = {
  id: string;
  title: string;
  start_date: string;
  city: string | null;
  country: string | null;
  level: string | null;
  winner: string | null;
};

const LEVEL_LABELS: Record<string, string> = {
  youth: "Youth",
  high_school: "High School",
  college: "College",
  national: "National",
  pro: "Pro",
  international: "International",
  olympics: "Olympics / World Games",
};

export async function LatestResultsTeaser() {
  const db = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // Get last 3 past events that have results
  const { data: raw } = await db
    .from("events")
    .select("id, title, start_date, city, country, level, event_results(place, team_name)")
    .lt("start_date", today)
    .order("start_date", { ascending: false })
    .limit(10);

  if (!raw) return null;

  const withResults: ResultEvent[] = raw
    .filter((e) => Array.isArray(e.event_results) && e.event_results.length > 0)
    .slice(0, 3)
    .map((e) => {
      const results = e.event_results as { place: number | null; team_name: string }[];
      const winner = results.find((r) => r.place === 1);
      return {
        id: e.id,
        title: e.title,
        start_date: e.start_date,
        city: e.city,
        country: e.country,
        level: e.level,
        winner: winner?.team_name ?? null,
      };
    });

  if (withResults.length === 0) return null;

  return (
    <section className="bg-[#0a0a0a] border-t border-brand-white/5 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-[#FDDD58] mb-2">
              Latest
            </p>
            <h2 className="font-display text-4xl md:text-5xl uppercase text-white leading-none">
              Tournament Results
            </h2>
          </div>
          <Link
            href="/results"
            className="text-[#FDDD58] font-display uppercase tracking-widest text-sm hover:underline hidden md:block"
          >
            All Results →
          </Link>
        </div>

        <div className="space-y-2">
          {withResults.map((e) => (
            <Link
              key={e.id}
              href={`/events/${e.id}`}
              className="group flex items-center justify-between gap-4 bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-base uppercase text-white group-hover:text-[#FDDD58] transition-colors truncate">
                  {e.title}
                </p>
                <p className="text-white/30 text-xs mt-0.5">
                  {[
                    e.level ? (LEVEL_LABELS[e.level] ?? e.level) : null,
                    e.city,
                    e.country,
                  ].filter(Boolean).join(" · ")}
                  {e.winner && (
                    <> · <span className="text-[#FDDD58]/70">🥇 {e.winner}</span></>
                  )}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <span className="text-white/20 text-xs hidden sm:block">
                  {new Date(e.start_date + "T12:00:00Z").toLocaleDateString("en-US", {
                    month: "short", year: "numeric", timeZone: "UTC",
                  })}
                </span>
                <span className="text-white/20 group-hover:text-[#FDDD58] transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 md:hidden">
          <Link href="/results" className="text-[#FDDD58] font-display uppercase tracking-widest text-sm hover:underline">
            All Results →
          </Link>
        </div>
      </div>
    </section>
  );
}

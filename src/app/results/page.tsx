import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Tournament Results | Talkin Flag",
  description:
    "Flag football tournament results from around the world — IFAF, national championships, and more. Curated by Talkin Flag.",
  path: "/results",
});

type EventWithResults = {
  id: string;
  title: string;
  start_date: string;
  city: string | null;
  country: string | null;
  level: string | null;
  result_count: number;
  top_team: string | null;
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

function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "";
  const offset = 127397;
  return Array.from(code.toUpperCase()).map((c) => String.fromCodePoint(c.charCodeAt(0) + offset)).join("");
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; level?: string }>;
}) {
  const { year, level } = await searchParams;
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  // Upcoming events (future-dated, no results required)
  const { data: upcomingRaw } = await supabase
    .from("events")
    .select("id, title, start_date, end_date, city, country, level, event_type, website_url")
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(12);
  const upcomingEvents = upcomingRaw ?? [];

  // Past events with results
  let query = supabase
    .from("events")
    .select("id, title, start_date, city, country, country_code, level, event_results(id, place, team_name)")
    .lt("start_date", today)
    .order("start_date", { ascending: false });

  if (level) query = query.eq("level", level);

  const { data: raw } = await query;

  // Filter to only events that have results
  const eventsWithResults = (raw ?? [])
    .filter((e) => Array.isArray(e.event_results) && e.event_results.length > 0)
    .map((e) => {
      const results = e.event_results as { id: string; place: number | null; team_name: string }[];
      const winner = results.find((r) => r.place === 1);
      return {
        id: e.id,
        title: e.title,
        start_date: e.start_date,
        city: e.city,
        country: e.country,
        country_code: (e as { country_code?: string | null }).country_code ?? null,
        level: e.level,
        result_count: results.length,
        top_team: winner?.team_name ?? null,
      };
    });

  // Filter by year if selected
  const filtered = year
    ? eventsWithResults.filter((e) => e.start_date.startsWith(year))
    : eventsWithResults;

  // Get available years for filter
  const years = Array.from(
    new Set(eventsWithResults.map((e) => e.start_date.slice(0, 4)))
  ).sort((a, b) => b.localeCompare(a));

  // Available levels
  const levels = Array.from(
    new Set(eventsWithResults.map((e) => e.level).filter(Boolean))
  ) as string[];

  return (
    <div className="bg-brand-black min-h-screen">
      {/* Header */}
      <div className="bg-[#FDDD58] px-6 py-14">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-black leading-none">
            Tournament<br className="hidden sm:block" /> Results
          </h1>
          <p className="text-black/60 mt-3 text-base max-w-xl">
            Official results from flag football tournaments around the world.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section className="mb-14">
            <h2 className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-6">
              Upcoming Events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="border border-brand-yellow/20 bg-[#111111] p-4 flex flex-col gap-2"
                >
                  <p className="font-display text-[10px] uppercase tracking-widest text-brand-yellow">
                    {evt.event_type ?? evt.level ?? "Event"}
                  </p>
                  <p className="font-display text-sm uppercase text-brand-white leading-tight">
                    {evt.title}
                  </p>
                  <p className="text-brand-white/50 text-xs">
                    {new Date(evt.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {evt.city ? ` · ${evt.city}` : ""}
                  </p>
                  {evt.website_url && (
                    <a
                      href={evt.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:underline mt-auto"
                    >
                      Info ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        {(years.length > 1 || levels.length > 1) && (
          <div className="flex flex-wrap gap-3 mb-10">
            {years.length > 1 && (
              <div className="flex gap-2 items-center">
                <span className="text-white/30 text-xs uppercase tracking-widest font-display">Year:</span>
                <Link
                  href="/results"
                  className={`font-display text-xs uppercase tracking-widest px-3 py-1 border transition-colors ${
                    !year ? "border-[#FDDD58] text-[#FDDD58]" : "border-white/10 text-white/40 hover:border-white/30"
                  }`}
                >
                  All
                </Link>
                {years.map((y) => (
                  <Link
                    key={y}
                    href={`/results?year=${y}${level ? `&level=${level}` : ""}`}
                    className={`font-display text-xs uppercase tracking-widest px-3 py-1 border transition-colors ${
                      year === y ? "border-[#FDDD58] text-[#FDDD58]" : "border-white/10 text-white/40 hover:border-white/30"
                    }`}
                  >
                    {y}
                  </Link>
                ))}
              </div>
            )}
            {levels.length > 1 && (
              <div className="flex gap-2 items-center">
                <span className="text-white/30 text-xs uppercase tracking-widest font-display">Level:</span>
                <Link
                  href={`/results${year ? `?year=${year}` : ""}`}
                  className={`font-display text-xs uppercase tracking-widest px-3 py-1 border transition-colors ${
                    !level ? "border-[#FDDD58] text-[#FDDD58]" : "border-white/10 text-white/40 hover:border-white/30"
                  }`}
                >
                  All
                </Link>
                {levels.map((l) => (
                  <Link
                    key={l}
                    href={`/results?${year ? `year=${year}&` : ""}level=${l}`}
                    className={`font-display text-xs uppercase tracking-widest px-3 py-1 border transition-colors ${
                      level === l ? "border-[#FDDD58] text-[#FDDD58]" : "border-white/10 text-white/40 hover:border-white/30"
                    }`}
                  >
                    {LEVEL_LABELS[l] ?? l}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/20 font-display uppercase tracking-widest text-sm">
              No results yet.
            </p>
            <p className="text-white/10 text-xs mt-2">
              Results are added after tournaments conclude.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="group flex items-center justify-between gap-4 bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {e.level && (
                      <span className="text-[#FDDD58]/60 font-display text-xs uppercase tracking-widest">
                        {LEVEL_LABELS[e.level] ?? e.level}
                      </span>
                    )}
                    <span className="text-white/10 text-xs">·</span>
                    <span className="text-white/30 text-xs">
                      {new Date(e.start_date + "T12:00:00Z").toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
                      })}
                    </span>
                  </div>
                  <p className="font-display text-lg uppercase text-white group-hover:text-[#FDDD58] transition-colors truncate">
                    {e.title}
                  </p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {[
                      e.country_code ? countryFlag(e.country_code) : null,
                      e.city,
                      e.country,
                    ].filter(Boolean).join(" ")}
                    {e.top_team && (
                      <> · <span className="text-[#FDDD58]/70">🥇 {e.top_team}</span></>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-white/20 font-display text-xs uppercase tracking-widest hidden sm:block">
                    {e.result_count} result{e.result_count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-white/20 group-hover:text-[#FDDD58] transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

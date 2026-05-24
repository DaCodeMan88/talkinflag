import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventRow {
  id: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  city?: string | null;
  country?: string | null;
  country_code?: string | null;
  level?: string | null;
  event_type?: string | null;
  website_url?: string | null;
  is_featured?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEVEL_LABELS: Record<string, string> = {
  youth: "Youth",
  high_school: "High School",
  college: "College",
  national: "National",
  pro: "Pro",
  international: "International",
  olympics: "Olympics / World Games",
};

function formatDateRange(start: string, end?: string | null): string {
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {
      ...opts,
      timeZone: "UTC",
    });

  if (!end || end === start) {
    return fmt(start, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  // Same month → "June 14 – 16, 2026"
  const s = new Date(start + "T12:00:00Z");
  const e = new Date(end + "T12:00:00Z");
  if (s.getUTCFullYear() === e.getUTCFullYear() && s.getUTCMonth() === e.getUTCMonth()) {
    return `${fmt(start, { month: "long", day: "numeric" })} – ${fmt(end, { day: "numeric", year: "numeric" })}`;
  }
  return `${fmt(start, { month: "long", day: "numeric", year: "numeric" })} – ${fmt(end, { month: "long", day: "numeric", year: "numeric" })}`;
}

function isSafeUrl(url: string | null | undefined): boolean {
  return !!(url && (url.startsWith("https://") || url.startsWith("http://")));
}

// ---------------------------------------------------------------------------
// generateStaticParams — build all upcoming event pages at deploy time
// ---------------------------------------------------------------------------

export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("events")
      .select("id")
      .gte("start_date", new Date().toISOString().split("T")[0]);
    return (data ?? []).map((row) => ({ id: row.id as string }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("title, description, city, country, start_date, level")
    .eq("id", id)
    .single();

  if (!event) return { title: "Event Not Found | Talkin Flag" };

  const location = [event.city, event.country].filter(Boolean).join(", ");
  const levelLabel = event.level ? LEVEL_LABELS[event.level] ?? event.level : null;
  const description =
    event.description?.slice(0, 160) ||
    [
      event.title,
      levelLabel,
      location,
      `${new Date(event.start_date + "T12:00:00Z").getFullYear()}`,
    ]
      .filter(Boolean)
      .join(" · ");

  return buildMetadata({
    title: event.title,
    description,
    path: `/events/${id}`,
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single() as { data: EventRow | null };

  if (!event) notFound();

  // Fetch upcoming events to show as "More Events" (same country or same level, excluding current)
  const today = new Date().toISOString().split("T")[0];
  let moreQuery = supabase
    .from("events")
    .select("id, title, start_date, end_date, city, country, level, event_type, website_url, is_featured")
    .gte("start_date", today)
    .neq("id", id)
    .order("start_date", { ascending: true });

  // Prefer same country or same level
  if (event.country) {
    moreQuery = moreQuery.or(`country.eq.${event.country},level.eq.${event.level}`);
  } else if (event.level) {
    moreQuery = moreQuery.eq("level", event.level);
  }

  const { data: moreEventsRaw } = await moreQuery.limit(3) as { data: EventRow[] | null };
  const moreEvents = moreEventsRaw ?? [];

  const location = [event.city, event.country].filter(Boolean).join(", ");
  const levelLabel = event.level ? (LEVEL_LABELS[event.level] ?? event.level.replaceAll("_", " ")) : null;
  const dateRange = formatDateRange(event.start_date, event.end_date);

  // JSON-LD — schema.org Event for Google rich results
  const startIso = new Date(event.start_date + "T12:00:00Z").toISOString();
  const endIso = event.end_date
    ? new Date(event.end_date + "T12:00:00Z").toISOString()
    : startIso;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": event.title,
    "url": `https://talkinflag.com/events/${event.id}`,
    "startDate": startIso,
    "endDate": endIso,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    ...(event.description && { "description": event.description }),
    ...(location && {
      "location": {
        "@type": "Place",
        "name": location,
        "address": {
          "@type": "PostalAddress",
          ...(event.city && { "addressLocality": event.city }),
          ...(event.country && { "addressCountry": event.country }),
        },
      },
    }),
    "organizer": {
      "@type": "Organization",
      "name": "Talkin Flag",
      "url": "https://talkinflag.com",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://talkinflag.com" },
      { "@type": "ListItem", "position": 2, "name": "Events", "item": "https://talkinflag.com/events" },
      { "@type": "ListItem", "position": 3, "name": event.title, "item": `https://talkinflag.com/events/${event.id}` },
    ],
  };

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back link */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-brand-white/50 hover:text-brand-yellow text-sm mb-10 transition-colors group"
        >
          <span className="transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
          Events Calendar
        </Link>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {event.is_featured && (
            <span className="bg-brand-yellow text-brand-black font-display text-xs px-3 py-1 uppercase tracking-widest">
              Featured
            </span>
          )}
          {levelLabel && (
            <span className="border border-brand-yellow/40 text-brand-yellow font-display text-xs px-3 py-1 uppercase tracking-widest">
              {levelLabel}
            </span>
          )}
          {event.event_type && (
            <span className="border border-brand-white/20 text-brand-white/60 text-xs px-3 py-1 uppercase tracking-widest font-display">
              {event.event_type}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <h1 className="font-display text-4xl md:text-6xl uppercase text-brand-white leading-none">
            {event.title}
          </h1>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">

          {/* Left: key facts */}
          <div className="md:col-span-1">
            <div className="bg-[#111111] border border-brand-white/10 p-6 space-y-5">
              <h2 className="font-display text-xs uppercase tracking-widest text-brand-yellow">
                Event Details
              </h2>

              <DetailRow label="Date" value={dateRange} />
              {location && <DetailRow label="Location" value={location} />}
              {event.country_code && (
                <DetailRow label="Country Code" value={event.country_code.toUpperCase()} />
              )}
              {levelLabel && <DetailRow label="Level" value={levelLabel} />}
              {event.event_type && (
                <DetailRow label="Type" value={event.event_type} />
              )}
            </div>

            {/* CTA: Official website */}
            {isSafeUrl(event.website_url) && (
              <a
                href={event.website_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-4 hover:bg-yellow-400 transition-colors"
              >
                Official Website ↗
              </a>
            )}

            {/* Share on X */}
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                `${event.title} — flag football event via @TalkinFlagShow 🏈`
              )}&url=${encodeURIComponent(`https://talkinflag.com/events/${event.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full border border-brand-white/20 text-brand-white/60 font-display text-xs uppercase tracking-widest px-6 py-3 hover:border-brand-white/40 hover:text-brand-white transition-colors"
              aria-label="Share on X"
            >
              <svg width="10" height="10" viewBox="0 0 1200 1227" fill="currentColor" aria-hidden="true">
                <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/>
              </svg>
              Share on X
            </a>
          </div>

          {/* Right: description */}
          <div className="md:col-span-2">
            {event.description ? (
              <div className="bg-[#111111] border border-brand-white/10 p-6 h-full">
                <h2 className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-4">
                  About This Event
                </h2>
                <p className="text-brand-white/70 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            ) : (
              <div className="bg-[#111111] border border-brand-yellow/10 p-10 text-center h-full flex flex-col items-center justify-center">
                <p className="text-brand-white/40 text-sm">
                  Additional event details available on the official website.
                </p>
                {isSafeUrl(event.website_url) && (
                  <a
                    href={event.website_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline"
                  >
                    Visit Official Website ↗
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* More upcoming events */}
        {moreEvents.length > 0 && (
          <div className="mt-16 pt-10 border-t border-brand-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg uppercase text-brand-white">
                More Upcoming Events
              </h2>
              <Link
                href="/events"
                className="text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline"
              >
                Full Calendar →
              </Link>
            </div>
            <div className="space-y-3">
              {moreEvents.map((e) => {
                const eLoc = [e.city, e.country].filter(Boolean).join(", ");
                const eLevel = e.level ? (LEVEL_LABELS[e.level] ?? e.level.replaceAll("_", " ")) : null;
                const eDate = new Date(e.start_date + "T12:00:00Z").toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
                });
                return (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="flex items-center gap-4 py-4 border-b border-brand-white/5 group hover:bg-brand-white/2 -mx-2 px-2 transition-colors"
                    aria-label={`View details for ${e.title}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {eLevel && (
                          <span className="font-display text-[10px] uppercase tracking-widest text-brand-yellow">
                            {eLevel}
                          </span>
                        )}
                        <span className="text-brand-white/40 text-xs">{eDate}</span>
                      </div>
                      <h3 className="font-display text-sm uppercase text-brand-white leading-tight truncate group-hover:text-brand-yellow transition-colors">
                        {e.title}
                      </h3>
                      {eLoc && <p className="text-brand-white/30 text-xs mt-0.5">{eLoc}</p>}
                    </div>
                    <span className="shrink-0 text-brand-yellow text-sm opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-10 border-t border-brand-white/10 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-1">
              Know of another event?
            </p>
            <p className="text-brand-white/60 text-sm">
              Help grow the global flag football calendar.
            </p>
          </div>
          <Link
            href="/events/submit"
            className="shrink-0 inline-flex items-center gap-2 border border-brand-yellow/40 text-brand-yellow font-display text-xs uppercase tracking-widest px-5 py-3 hover:bg-brand-yellow hover:text-brand-black transition-colors"
          >
            + Submit an Event
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-brand-white/50 flex-shrink-0">{label}</span>
      <span className="text-brand-white text-right">{value}</span>
    </div>
  );
}

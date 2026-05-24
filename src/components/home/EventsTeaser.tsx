import { createServerClient } from "@/lib/supabase";
import Link from "next/link";

interface TeaserEvent {
  id: string;
  title: string;
  start_date: string;
  end_date?: string | null;
  city?: string | null;
  country?: string | null;
  level?: string | null;
  event_type?: string | null;
  website_url?: string | null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z"); // avoid TZ offset issues
  return {
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(),
    day: d.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" }),
    year: d.toLocaleDateString("en-US", { year: "numeric", timeZone: "UTC" }),
  };
}

export async function EventsTeaser() {
  const supabase = createServerClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: events } = await supabase
    .from("events")
    .select("id, title, start_date, end_date, city, country, level, event_type, website_url, is_featured")
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(3);

  if (!events || events.length === 0) return null;

  return (
    <section className="bg-[#0a0a0a] py-20 px-6 border-t border-brand-white/5" aria-label="Upcoming events">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-display text-4xl md:text-6xl uppercase text-brand-white">
            Upcoming Events
          </h2>
          <Link
            href="/events"
            className="text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline hidden md:block"
          >
            Full Calendar →
          </Link>
        </div>

        {/* Event rows */}
        <div className="divide-y divide-brand-white/8">
          {(events as TeaserEvent[]).map((event) => {
            const start = formatDate(event.start_date);
            const location = [event.city, event.country].filter(Boolean).join(", ");
            const levelLabel = event.level?.replace(/_/g, " ").toUpperCase();

            return (
              <div
                key={event.id}
                className="flex items-center gap-6 py-5 group hover:bg-brand-white/2 -mx-4 px-4 transition-colors"
              >
                {/* Date badge */}
                <div className="shrink-0 w-14 text-center">
                  <div className="font-display text-brand-yellow text-[10px] uppercase tracking-widest leading-none">
                    {start.month}
                  </div>
                  <div className="font-display text-2xl text-brand-white leading-tight">
                    {start.day}
                  </div>
                  <div className="font-display text-brand-white/30 text-[10px] leading-none mt-0.5">
                    {start.year}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-10 bg-brand-yellow/20 shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {levelLabel && (
                      <span className="font-display text-[10px] uppercase tracking-widest text-brand-yellow">
                        {levelLabel}
                      </span>
                    )}
                    {event.event_type && (
                      <span className="text-brand-white/30 text-xs">{event.event_type}</span>
                    )}
                  </div>
                  <h3 className="font-display text-base md:text-lg uppercase text-brand-white leading-tight truncate group-hover:text-brand-yellow transition-colors">
                    {event.title}
                  </h3>
                  {location && (
                    <p className="text-brand-white/40 text-xs mt-0.5">{location}</p>
                  )}
                </div>

                {/* External link */}
                {event.website_url && (
                  <a
                    href={event.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline"
                    aria-label={`Details for ${event.title}`}
                  >
                    Details ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/events"
            className="text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline"
          >
            Full Calendar →
          </Link>
        </div>

      </div>
    </section>
  );
}

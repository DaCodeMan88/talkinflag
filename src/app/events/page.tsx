import { createServerClient } from "@/lib/supabase";
import { EventCard } from "@/components/events/EventCard";
import { GlobeSection } from "@/components/events/GlobeSection";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Events | Talkin Flag — Flag Football Calendar",
  description: "Worldwide flag football tournaments, national championships, World Games, and Olympic qualifiers.",
  path: "/events",
});

function getMonthKey(dateStr: string): string {
  // Use noon UTC to avoid date-shift across timezones
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

type Event = {
  id: string;
  title: string;
  start_date: string;
  end_date?: string | null;
  city?: string | null;
  country?: string | null;
  level?: string | null;
  event_type?: string | null;
  website_url?: string | null;
  description?: string | null;
  is_featured?: boolean;
};

export default async function EventsPage() {
  const supabase = createServerClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .gte("start_date", new Date().toISOString().split("T")[0])
    .order("start_date", { ascending: true })
    .limit(50);

  // Group events by month label
  const eventsByMonth: { month: string; events: Event[] }[] = [];
  if (events && events.length > 0) {
    for (const event of events as Event[]) {
      const month = getMonthKey(event.start_date);
      const group = eventsByMonth.find((g) => g.month === month);
      if (group) {
        group.events.push(event);
      } else {
        eventsByMonth.push({ month, events: [event] });
      }
    }
  }

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Events</h1>
              <p className="mt-3 text-brand-white/60">Worldwide flag football tournaments, world games, and Olympic qualifiers.</p>
            </div>
            <Link
              href="/events/submit"
              className="shrink-0 inline-flex items-center gap-2 border border-brand-yellow/40 text-brand-yellow font-display text-xs uppercase tracking-widest px-4 py-2 hover:bg-brand-yellow hover:text-brand-black transition-colors mt-2"
            >
              + Submit Event
            </Link>
          </div>
        </div>

        {/* 3D Guest Globe */}
        <div className="mb-16 bg-[#111111] border border-brand-yellow/20 p-8">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-1">Global Flag Football Community</h2>
          <p className="text-brand-white/60 text-sm mb-6">Countries represented on Talkin Flag</p>
          <GlobeSection />
        </div>

        {/* Events list — grouped by month */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl uppercase text-brand-white">
              Upcoming Events
              {events && events.length > 0 && (
                <span className="ml-3 text-brand-white/30 font-display text-sm normal-case tracking-normal">
                  {events.length} {events.length === 1 ? "event" : "events"}
                </span>
              )}
            </h2>
          </div>

          {eventsByMonth.length === 0 ? (
            <div className="text-center py-16 border border-brand-yellow/20 bg-[#111111]">
              <p className="font-display text-xl uppercase text-brand-yellow mb-2">Calendar Coming Soon</p>
              <p className="text-brand-white/60 text-sm max-w-md mx-auto">
                Flag football events from around the world will be listed here.
              </p>
              <Link
                href="/events/submit"
                className="inline-flex items-center gap-2 mt-6 bg-brand-yellow text-brand-black font-display text-xs uppercase tracking-widest px-6 py-3 hover:bg-yellow-400 transition-colors"
              >
                Submit an Event
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              {eventsByMonth.map(({ month, events: monthEvents }) => (
                <div key={month}>
                  {/* Month heading */}
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
                      {month}
                    </h3>
                    <div className="flex-1 h-px bg-brand-yellow/15" />
                  </div>
                  {/* Events in this month */}
                  <div className="space-y-3">
                    {monthEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

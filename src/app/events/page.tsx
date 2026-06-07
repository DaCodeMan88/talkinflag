import { createServerClient } from "@/lib/supabase";
import { EventsFilter } from "@/components/events/EventsFilter";
import { PastEventsSection } from "@/components/events/PastEventsSection";
import { GlobeSection } from "@/components/events/GlobeSection";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { Suspense } from "react";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Events | Talkin Flag — Flag Football Calendar",
  description: "Worldwide flag football tournaments, national championships, World Games, and Olympic qualifiers.",
  path: "/events",
});

export default async function EventsPage() {
  const supabase = createServerClient();
  const today = new Date().toISOString().split("T")[0];

  const [{ data: events }, { data: pastEvents }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("is_approved", true)
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(50),
    supabase
      .from("events")
      .select("id, title, start_date, end_date, city, country, country_code, level, event_type, website_url, is_featured")
      .eq("is_approved", true)
      .lt("start_date", today)
      .order("start_date", { ascending: false })
      .limit(20),
  ]);

  const eventList = events ?? [];
  const pastEventList = pastEvents ?? [];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://talkinflag.com" },
      { "@type": "ListItem", "position": 2, "name": "Events", "item": "https://talkinflag.com/events" },
    ],
  };

  const itemListJsonLd = eventList.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Upcoming Flag Football Events",
        "url": "https://talkinflag.com/events",
        "itemListElement": eventList.map((e: { id: string; title: string }, i: number) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": e.title,
          "url": `https://talkinflag.com/events/${e.id}`,
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
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

        {/* Events section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl uppercase text-brand-white">
              Upcoming Events
              {eventList.length > 0 && (
                <span className="ml-3 text-brand-white/30 font-display text-sm normal-case tracking-normal">
                  {eventList.length} {eventList.length === 1 ? "event" : "events"}
                </span>
              )}
            </h2>
          </div>

          {eventList.length === 0 ? (
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
            <EventsFilter events={eventList} />
          )}

          {/* Past events */}
          {pastEventList.length > 0 && (
            <Suspense fallback={null}>
              <PastEventsSection events={pastEventList} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

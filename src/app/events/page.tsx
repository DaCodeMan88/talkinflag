import { createServerClient } from "@/lib/supabase";
import { EventCard } from "@/components/events/EventCard";
import { GlobeSection } from "@/components/events/GlobeSection";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Events | Talkin Flag — Flag Football Calendar",
  description: "Worldwide flag football tournaments, national championships, World Games, and Olympic qualifiers.",
  path: "/events",
});

export default async function EventsPage() {
  const supabase = createServerClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .gte("start_date", new Date().toISOString().split("T")[0])
    .order("start_date", { ascending: true })
    .limit(50);

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Events</h1>
          <p className="mt-3 text-brand-white/60">Worldwide flag football tournaments, world games, and Olympic qualifiers.</p>
        </div>

        {/* 3D Guest Globe */}
        <div className="mb-16 bg-[#111111] border border-brand-yellow/20 p-8">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-1">Global Flag Football Community</h2>
          <p className="text-brand-white/60 text-sm mb-6">Countries represented on Talkin Flag</p>
          <GlobeSection />
        </div>

        {/* Events list */}
        <div>
          <h2 className="font-display text-2xl uppercase text-brand-white mb-6">Upcoming Events</h2>
          {!events || events.length === 0 ? (
            <div className="text-center py-16 border border-brand-yellow/20 bg-[#111111]">
              <p className="font-display text-xl uppercase text-brand-yellow mb-2">Calendar Coming Soon</p>
              <p className="text-brand-white/60 text-sm max-w-md mx-auto">
                Flag football events from around the world will be listed here.
                Add events via the Supabase dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

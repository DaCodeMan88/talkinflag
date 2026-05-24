"use client";
import { useState, useMemo } from "react";
import { EventCard } from "./EventCard";

interface Event {
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
}

const LEVEL_LABELS: Record<string, string> = {
  youth: "Youth",
  high_school: "High School",
  college: "College",
  national: "National",
  pro: "Pro",
  international: "International",
  olympics: "Olympics / World Games",
};

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function EventsFilter({ events }: { events: Event[] }) {
  const [activeLevel, setActiveLevel] = useState<string>("all");

  // Derive unique levels present in the events list
  const availableLevels = useMemo(() => {
    const levels = new Set<string>();
    events.forEach((e) => { if (e.level) levels.add(e.level); });
    return Array.from(levels).sort();
  }, [events]);

  const filtered = useMemo(() => {
    if (activeLevel === "all") return events;
    return events.filter((e) => e.level === activeLevel);
  }, [events, activeLevel]);

  // Group filtered events by month
  const eventsByMonth = useMemo(() => {
    const groups: { month: string; events: Event[] }[] = [];
    for (const event of filtered) {
      const month = getMonthKey(event.start_date);
      const group = groups.find((g) => g.month === month);
      if (group) group.events.push(event);
      else groups.push({ month, events: [event] });
    }
    return groups;
  }, [filtered]);

  return (
    <div>
      {/* Level filter tabs — only shown when multiple levels exist */}
      {availableLevels.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveLevel("all")}
            className={`font-display text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${
              activeLevel === "all"
                ? "bg-brand-yellow text-brand-black border-brand-yellow"
                : "border-brand-white/20 text-brand-white/60 hover:border-brand-yellow/40 hover:text-brand-yellow"
            }`}
          >
            All ({events.length})
          </button>
          {availableLevels.map((level) => {
            const count = events.filter((e) => e.level === level).length;
            return (
              <button
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`font-display text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${
                  activeLevel === level
                    ? "bg-brand-yellow text-brand-black border-brand-yellow"
                    : "border-brand-white/20 text-brand-white/60 hover:border-brand-yellow/40 hover:text-brand-yellow"
                }`}
              >
                {LEVEL_LABELS[level] || level.replace(/_/g, " ")} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {eventsByMonth.length === 0 && (
        <div className="text-center py-12 border border-brand-white/10 bg-[#111111]">
          <p className="text-brand-white/40 text-sm">
            No {activeLevel !== "all" ? (LEVEL_LABELS[activeLevel] || activeLevel) + " " : ""}events found.
          </p>
          {activeLevel !== "all" && (
            <button
              onClick={() => setActiveLevel("all")}
              className="mt-3 text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline"
            >
              Show all events
            </button>
          )}
        </div>
      )}

      {/* Events grouped by month */}
      <div className="space-y-10">
        {eventsByMonth.map(({ month, events: monthEvents }) => (
          <div key={month}>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
                {month}
              </h3>
              <div className="flex-1 h-px bg-brand-yellow/15" />
            </div>
            <div className="space-y-3">
              {monthEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

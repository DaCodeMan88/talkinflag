"use client";
import { useState, useMemo } from "react";
import { EventCard } from "./EventCard";
import Link from "next/link";
import { Search, X } from "lucide-react";

interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date?: string | null;
  city?: string | null;
  country?: string | null;
  country_code?: string | null;
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

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

export function EventsFilter({ events }: { events: Event[] }) {
  const [query, setQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState<string>("all");
  const [activeType, setActiveType] = useState<string>("all");
  const [activeCountry, setActiveCountry] = useState<string>("");

  // Separate featured events (pinned at top regardless of filter)
  const featuredEvents = useMemo(
    () => events.filter((e) => e.is_featured),
    [events]
  );

  // Derive unique levels present in the events list
  const availableLevels = useMemo(() => {
    const levels = new Set<string>();
    events.forEach((e) => { if (e.level) levels.add(e.level); });
    return Array.from(levels).sort();
  }, [events]);

  // Derive unique countries
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => { if (e.country) set.add(e.country); });
    return Array.from(set).sort();
  }, [events]);

  // Derive unique event types
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => { if (e.event_type) set.add(e.event_type); });
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    let result = events.filter((e) => !e.is_featured);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q) ||
        e.country?.toLowerCase().includes(q) ||
        e.event_type?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }
    if (activeLevel !== "all") result = result.filter((e) => e.level === activeLevel);
    if (activeType !== "all") result = result.filter((e) => e.event_type === activeType);
    if (activeCountry) result = result.filter((e) => e.country === activeCountry);
    return result;
  }, [events, query, activeLevel, activeCountry]);

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
      {/* Featured / Marquee events — pinned at top */}
      {featuredEvents.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
              Marquee Events
            </h3>
            <div className="flex-1 h-px bg-brand-yellow/30" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredEvents.map((event) => {
              const location = [event.city, event.country].filter(Boolean).join(", ");
              const levelLabel = event.level?.replace(/_/g, " ").toUpperCase();
              return (
                <div
                  key={event.id}
                  className="relative bg-[#111111] border border-brand-yellow/40 p-6 flex flex-col group hover:border-brand-yellow/70 transition-colors"
                >
                  {/* Full-card internal link */}
                  <Link
                    href={`/events/${event.id}`}
                    className="absolute inset-0 z-0"
                    aria-label={`View details for ${event.title}`}
                  />
                  <div className="flex items-center gap-2 flex-wrap mb-2 relative z-10">
                    <span className="bg-brand-yellow text-brand-black font-display text-[10px] px-2 py-0.5 uppercase tracking-widest">
                      Featured
                    </span>
                    {levelLabel && (
                      <span className="text-brand-yellow font-display text-[10px] uppercase tracking-widest">
                        {levelLabel}
                      </span>
                    )}
                  </div>
                  <h4 className="font-display text-lg uppercase text-brand-white leading-tight mb-2 flex-1 relative z-10 group-hover:text-brand-yellow transition-colors">
                    {event.title}
                  </h4>
                  <p className="text-brand-white/60 text-sm mb-1 relative z-10">{formatShortDate(event.start_date)}</p>
                  {location && (
                    <p className="text-brand-white/40 text-xs mb-4 relative z-10">{location}</p>
                  )}
                  <div className="flex items-center gap-3 mt-auto relative z-10">
                    <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">
                      View Details →
                    </span>
                    {event.website_url && (
                      <a
                        href={event.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-white/40 font-display text-xs uppercase tracking-widest hover:text-brand-white transition-colors"
                        aria-label={`Official website for ${event.title}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Site ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-white/30 pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events by name, location, or type…"
          aria-label="Search events"
          className="w-full bg-[#111111] border border-brand-white/15 text-brand-white pl-10 pr-10 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/30"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-white/40 hover:text-brand-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Level filter tabs — only shown when multiple levels exist */}
      {/* Derive levels from non-featured events only */}
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
            All Other Events ({events.filter((e) => !e.is_featured).length})
          </button>
          {availableLevels.map((level) => {
            const count = events.filter((e) => e.level === level && !e.is_featured).length;
            if (count === 0) return null;
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

      {/* Event type filter tabs */}
      {availableTypes.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveType("all")}
            className={`font-display text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${
              activeType === "all"
                ? "bg-brand-white/10 text-brand-white border-brand-white/30"
                : "border-brand-white/15 text-brand-white/40 hover:border-brand-white/30 hover:text-brand-white/70"
            }`}
          >
            All Types
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`font-display text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${
                activeType === type
                  ? "bg-brand-white/10 text-brand-white border-brand-white/30"
                  : "border-brand-white/15 text-brand-white/40 hover:border-brand-white/30 hover:text-brand-white/70"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Country filter — only shown when multiple countries in the list */}
      {availableCountries.length > 1 && (
        <div className="flex items-center gap-3 mb-6">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-white/30" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <div className="relative">
            <select
              value={activeCountry}
              onChange={(e) => setActiveCountry(e.target.value)}
              aria-label="Filter by country"
              className="appearance-none bg-[#111111] border border-brand-white/15 text-brand-white/70 pl-3 pr-8 py-1.5 text-xs font-display uppercase tracking-widest focus:border-brand-yellow focus:outline-none cursor-pointer"
            >
              <option value="">All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-brand-white/40">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" aria-hidden="true">
                <path d="M0 0l5 6 5-6z" />
              </svg>
            </div>
          </div>
          {activeCountry && (
            <button
              onClick={() => setActiveCountry("")}
              aria-label="Clear country filter"
              className="text-brand-white/40 hover:text-brand-yellow transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {eventsByMonth.length === 0 && (
        <div className="text-center py-12 border border-brand-white/10 bg-[#111111]">
          <p className="text-brand-white/40 text-sm">
            No {activeLevel !== "all" ? (LEVEL_LABELS[activeLevel] || activeLevel) + " " : ""}
            {activeCountry ? `events in ${activeCountry}` : "events"} found.
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

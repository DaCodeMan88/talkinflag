"use client";

import { useState } from "react";
import { EventCard } from "./EventCard";

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
  is_featured?: boolean;
}

export function PastEventsSection({ events }: { events: Event[] }) {
  const [open, setOpen] = useState(false);

  if (events.length === 0) return null;

  return (
    <div className="mt-16 border-t border-brand-white/10 pt-10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 group mb-6"
      >
        <h2 className="font-display text-xl uppercase text-brand-white/40 group-hover:text-brand-white/70 transition-colors">
          Past Events
        </h2>
        <span className="text-brand-white/30 font-display text-xs uppercase tracking-widest">
          ({events.length})
        </span>
        <svg
          width="12" height="8" viewBox="0 0 12 8" fill="currentColor"
          className={`text-brand-white/30 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M0 0l6 8 6-8z" />
        </svg>
      </button>

      {open && (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

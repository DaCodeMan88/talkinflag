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
  is_featured?: boolean;
}

export function EventCard({ event }: { event: Event }) {
  const levelLabel = event.level?.replace("_", " ");
  const location = [event.city, event.country].filter(Boolean).join(", ");
  const dateStr = event.end_date && event.end_date !== event.start_date
    ? `${new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(event.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : new Date(event.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <article className={`bg-[#222222] border ${event.is_featured ? "border-brand-yellow/50" : "border-brand-white/10"} p-5 hover:border-brand-yellow/40 transition-colors`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {event.is_featured && (
              <span className="bg-brand-yellow text-brand-black font-display text-xs px-2 py-0.5 uppercase tracking-widest">
                Featured
              </span>
            )}
            {levelLabel && (
              <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">
                {levelLabel}
              </span>
            )}
            {event.event_type && (
              <span className="text-brand-white/40 text-xs">{event.event_type}</span>
            )}
          </div>
          <h3 className="font-display text-lg uppercase text-brand-white leading-tight">{event.title}</h3>
          <p className="text-brand-white/60 text-sm mt-1">{dateStr}</p>
          {location && <p className="text-brand-white/40 text-xs mt-1">{location}</p>}
        </div>
        {event.website_url && (
          <a
            href={event.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline"
            aria-label={`Visit website for ${event.title}`}
          >
            Details ↗
          </a>
        )}
      </div>
    </article>
  );
}

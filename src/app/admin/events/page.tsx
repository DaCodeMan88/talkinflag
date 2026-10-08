import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import Link from "next/link";
import EventApproveRejectButtons from "./EventApproveRejectButtons";
import { eventPath, isPastEvent } from "@/lib/events/path";

export const metadata = { title: "Events | Admin" };

const LEVEL_LABELS: Record<string, string> = {
  youth: "Youth",
  high_school: "High School",
  college: "College",
  national: "National",
  pro: "Pro",
  international: "International",
  olympics: "Olympics / World Games",
};

interface EventRow {
  id: string;
  title: string;
  description?: string | null;
  start_date: string;
  city?: string | null;
  country?: string | null;
  level?: string | null;
  event_type?: string | null;
  website_url?: string | null;
  submitter_email?: string | null;
  created_at: string;
}

export default async function AdminEventsPage() {
  if (!(await getAdminUser())) redirect("/");
  const supabase = createAdminClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("is_approved", false)
    .is("rejected_at", null)
    .order("created_at", { ascending: false });

  const pending = (events ?? []) as EventRow[];

  const { data: approvedRaw } = await supabase
    .from("events")
    .select("id, slug, title, start_date, end_date, city, country, event_results(count)")
    .eq("is_approved", true)
    .order("start_date", { ascending: false });
  const approved = (approvedRaw ?? []) as {
    id: string; slug: string | null; title: string; start_date: string; end_date: string | null;
    city: string | null; country: string | null; event_results: { count: number }[];
  }[];
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <h1 className="font-display text-4xl uppercase text-brand-white leading-none">Events</h1>
          <p className="text-brand-white/40 mt-2 text-sm">{pending.length} pending review</p>
        </div>

        {pending.length === 0 && (
          <p className="text-brand-white/30 text-sm mb-10">No pending event submissions.</p>
        )}

        <div className="space-y-4 mb-12">
          {pending.map((ev) => {
            const location = [ev.city, ev.country].filter(Boolean).join(", ");
            const levelLabel = ev.level ? (LEVEL_LABELS[ev.level] ?? ev.level) : null;
            return (
              <div key={ev.id} className="bg-[#0d0d0d] border border-brand-white/10 p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-brand-white font-semibold">{ev.title}</p>
                    {location && <p className="text-brand-white/40 text-sm">{location}</p>}
                    <p className="text-brand-white/30 text-xs mt-1">
                      {new Date(ev.start_date + "T12:00:00Z").toLocaleDateString("en-US", {
                        month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
                      })}
                    </p>
                  </div>
                  <span className="text-brand-white/20 text-xs font-display uppercase tracking-widest flex-shrink-0">
                    {new Date(ev.created_at).toLocaleDateString()}
                  </span>
                </div>

                {(levelLabel || ev.event_type) && (
                  <div className="flex flex-wrap gap-2">
                    {levelLabel && (
                      <span className="border border-brand-yellow/40 text-brand-yellow font-display text-[10px] px-3 py-1 uppercase tracking-widest">
                        {levelLabel}
                      </span>
                    )}
                    {ev.event_type && (
                      <span className="border border-brand-white/20 text-brand-white/60 font-display text-[10px] px-3 py-1 uppercase tracking-widest">
                        {ev.event_type}
                      </span>
                    )}
                  </div>
                )}

                {ev.description && (
                  <div>
                    <p className="text-brand-white/30 text-xs font-display uppercase tracking-widest mb-1">Description</p>
                    <p className="text-brand-white/60 text-sm whitespace-pre-line">{ev.description}</p>
                  </div>
                )}

                {ev.website_url && (
                  <a
                    href={ev.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-brand-yellow text-sm hover:underline break-all"
                  >
                    {ev.website_url} ↗
                  </a>
                )}

                <p className="text-brand-white/40 text-xs">
                  Submitter: {ev.submitter_email || "— (no email provided)"}
                </p>

                <EventApproveRejectButtons eventId={ev.id} canEmail={!!ev.submitter_email} />
              </div>
            );
          })}
        </div>

        <div className="border-l-4 border-brand-yellow pl-6 mb-6">
          <h2 className="font-display text-2xl uppercase text-brand-white leading-none">All Events</h2>
          <p className="text-brand-white/40 mt-2 text-sm">
            {approved.length} live. Edit details (location, dates, description) or add results once an event is over.
          </p>
        </div>
        <div className="divide-y divide-brand-white/5 border border-brand-white/10">
          {approved.map((ev) => {
            const past = isPastEvent(ev, today);
            const resultCount = ev.event_results?.[0]?.count ?? 0;
            const location = [ev.city, ev.country].filter(Boolean).join(", ");
            const needsLocation = !ev.city || /^tbd$/i.test(ev.city.trim());
            return (
              <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-brand-white text-sm font-semibold truncate">{ev.title}</p>
                  <p className="text-brand-white/40 text-xs">
                    {new Date(ev.start_date + "T12:00:00Z").toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
                    })}
                    {location && ` · ${location}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {needsLocation && (
                    <span className="text-amber-300 text-[10px] font-display uppercase tracking-widest border border-amber-300/40 px-2 py-0.5">
                      Location TBD
                    </span>
                  )}
                  {past && resultCount === 0 && (
                    <span className="text-amber-300 text-[10px] font-display uppercase tracking-widest border border-amber-300/40 px-2 py-0.5">
                      Needs results
                    </span>
                  )}
                  <Link href={`/admin/events/${ev.id}/edit`} className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:underline">
                    Edit
                  </Link>
                  <Link href={`/admin/events/${ev.id}/results`} className="text-brand-white/60 text-xs font-display uppercase tracking-widest hover:text-brand-yellow">
                    Results{resultCount > 0 ? ` (${resultCount})` : ""}
                  </Link>
                  <Link href={eventPath(ev)} className="text-brand-white/40 text-xs font-display uppercase tracking-widest hover:text-brand-white">
                    View ↗
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

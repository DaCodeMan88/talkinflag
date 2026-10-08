"use client";

import { useState, useTransition } from "react";
import { updateEvent } from "./actions";
import { EVENT_LEVELS, type EventEdit } from "@/lib/events/edit";

const LEVEL_LABELS: Record<string, string> = {
  youth: "Youth",
  high_school: "High School",
  college: "College",
  national: "National",
  pro: "Pro",
  international: "International",
  olympics: "Olympics / World Games",
};

const input =
  "w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#FDDD58]/50";
const label = "block text-white/40 text-xs uppercase tracking-widest mb-1.5";

function Field({ name, title, value, placeholder, hint, type = "text", required = false }: {
  name: keyof EventEdit; title: string; value: string | null; placeholder?: string; hint?: string;
  type?: string; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className={label}>
        {title} {required && <span className="text-[#FDDD58]">*</span>}
      </label>
      <input id={name} name={name} type={type} required={required} defaultValue={value ?? ""} placeholder={placeholder} className={input} />
      {hint && <p className="text-white/25 text-xs mt-1">{hint}</p>}
    </div>
  );
}

export function EventEditForm({ eventId, event }: { eventId: string; event: EventEdit }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateEvent(eventId, fd);
      if (res.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <Field name="title" title="Title" value={event.title} required />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="start_date" title="Start date" type="date" value={event.start_date} required />
        <Field name="end_date" title="End date" type="date" value={event.end_date} hint="Leave blank for a one-day event." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="city" title="City" value={event.city} placeholder="Düsseldorf" />
        <Field name="country" title="Country" value={event.country} placeholder="Germany" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="country_code" title="Country code" value={event.country_code} placeholder="DE" hint="Two letters. Shows the flag." />
        <Field name="location" title="Venue" value={event.location} placeholder="Flag Football Complex, Garath" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="level" className={label}>Level</label>
          <select id="level" name="level" defaultValue={event.level ?? ""} className={input}>
            <option value="">(none)</option>
            {EVENT_LEVELS.map((l) => (
              <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
            ))}
          </select>
        </div>
        <Field name="event_type" title="Type" value={event.event_type} placeholder="Tournament" />
      </div>

      <Field name="website_url" title="Official website" value={event.website_url} placeholder="https://" />

      <div>
        <label htmlFor="description" className={label}>About this event</label>
        <textarea id="description" name="description" rows={6} defaultValue={event.description ?? ""} className={input} />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {saved && <p className="text-green-400 text-sm">✓ Saved. The public page updates within a minute.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-[#FDDD58] text-black font-display uppercase tracking-widest px-6 py-2.5 text-sm hover:bg-[#FDDD58]/80 transition-colors disabled:opacity-40"
      >
        {isPending ? "Saving…" : "Save Event →"}
      </button>
    </form>
  );
}

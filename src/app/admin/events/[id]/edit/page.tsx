import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { eventPath } from "@/lib/events/path";
import type { EventEdit } from "@/lib/events/edit";
import { EventEditForm } from "./EventEditForm";

export const metadata = { title: "Edit Event | Admin" };

export default async function AdminEventEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await getAdminUser())) redirect("/");

  const { data } = await createAdminClient()
    .from("events")
    .select("id, slug, title, description, start_date, end_date, location, city, country, country_code, level, event_type, website_url")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const event = data as EventEdit & { id: string; slug: string | null };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/events" className="text-white/30 hover:text-white/60 text-xs font-display uppercase tracking-widest transition-colors">
          ← Events
        </Link>
        <span className="text-white/10">/</span>
        <Link href={`/admin/events/${id}/results`} className="text-white/30 hover:text-white/60 text-xs font-display uppercase tracking-widest transition-colors">
          Results
        </Link>
        <span className="text-white/10">/</span>
        <Link href={eventPath(event)} className="text-white/30 hover:text-white/60 text-xs font-display uppercase tracking-widest transition-colors">
          View page ↗
        </Link>
      </div>

      <div className="border-l-4 border-[#FDDD58] pl-6 mb-10 mt-4">
        <h1 className="font-display text-4xl uppercase text-white leading-none">Edit Event</h1>
        <p className="text-white/40 mt-2 text-sm truncate">{event.title}</p>
        <p className="text-white/20 text-xs mt-1 break-all">talkinflag.com{eventPath(event)}</p>
      </div>

      <EventEditForm eventId={id} event={event} />
    </div>
  );
}

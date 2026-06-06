import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResultsForm } from "./ResultsForm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "daniel@dubsportsentertainment.com";

type Result = {
  id: string;
  place: number | null;
  team_name: string;
  division: string | null;
  score: string | null;
  notes: string | null;
};

export default async function AdminEventResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/auth/login?next=/admin/events/${id}/results`);
  if (user.email !== ADMIN_EMAIL) {
    return <div className="p-8 text-white"><p className="text-red-400">Not authorized.</p></div>;
  }

  const [{ data: event }, { data: resultsRaw }] = await Promise.all([
    supabase.from("events").select("id, title, start_date").eq("id", id).single(),
    supabase
      .from("event_results")
      .select("id, place, team_name, division, score, notes")
      .eq("event_id", id)
      .order("place", { ascending: true, nullsFirst: false }),
  ]);

  if (!event) notFound();

  const results = (resultsRaw ?? []) as Result[];

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin" className="text-white/30 hover:text-white/60 text-xs font-display uppercase tracking-widest transition-colors">
          ← Admin
        </Link>
        <span className="text-white/10">/</span>
        <Link href={`/events/${id}`} className="text-white/30 hover:text-white/60 text-xs font-display uppercase tracking-widest transition-colors">
          Event
        </Link>
      </div>

      <div className="border-l-4 border-[#FDDD58] pl-6 mb-10 mt-4">
        <h1 className="font-display text-4xl uppercase text-white leading-none">Results</h1>
        <p className="text-white/40 mt-2 text-sm truncate">{event.title}</p>
        <p className="text-white/20 text-xs mt-1">
          {new Date(event.start_date + "T12:00:00Z").toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
          })}
        </p>
      </div>

      <ResultsForm eventId={id} existing={results} />
    </div>
  );
}

import { createServerClient } from "@/lib/supabase";
import { CoachesFilter } from "@/components/coaches/CoachesFilter";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { Suspense } from "react";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Coaches | Talkin Flag — Flag Football Coaches Directory",
  description: "Verified flag football coaches from youth to national team level. Browse the global coaching directory.",
  path: "/coaches",
});

export default async function CoachesPage() {
  const supabase = createServerClient();

  const { data: coaches } = await supabase
    .from("coaches")
    .select("id, first_name, last_name, team, level, title, wins, losses")
    .eq("is_verified", true)
    .order("last_name", { ascending: true });

  const coachList = coaches ?? [];

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Coaches</h1>
              <p className="mt-3 text-brand-white/60">Verified flag football coaches from youth to national team level.</p>
            </div>
            <Link
              href="/coaches/apply"
              className="shrink-0 inline-flex items-center gap-2 border border-brand-yellow/40 text-brand-yellow font-display text-xs uppercase tracking-widest px-4 py-2 hover:bg-brand-yellow hover:text-brand-black transition-colors mt-2"
            >
              + Apply
            </Link>
          </div>
        </div>

        {coachList.length === 0 ? (
          <div className="text-center py-20 border border-brand-yellow/20 bg-[#111111]">
            <p className="font-display text-2xl uppercase text-brand-yellow mb-3">
              Coaches Directory Coming Soon
            </p>
            <p className="text-brand-white/60 text-sm max-w-md mx-auto">
              Verified coaches will be listed here. Apply to get your profile added.
            </p>
            <Link
              href="/coaches/apply"
              className="inline-block mt-6 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3 hover:bg-yellow-400 transition-colors"
            >
              Apply as a Coach
            </Link>
          </div>
        ) : (
          <Suspense fallback={
            <div className="text-brand-white/40 text-sm py-8 text-center font-display uppercase tracking-widest">
              Loading coaches…
            </div>
          }>
            <CoachesFilter coaches={coachList} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

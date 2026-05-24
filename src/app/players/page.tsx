import { createServerClient } from "@/lib/supabase";
import { PlayersFilter } from "@/components/players/PlayersFilter";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import type { Player } from "@/types/player";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Players | Talkin Flag — Flag Football Rankings",
  description: "The global flag football player database. Rankings, stats, and highlights.",
  path: "/players",
});

export default async function PlayersPage() {
  const supabase = createServerClient();

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("is_verified", true)
    .order("ranking_national", { ascending: true, nullsFirst: false })
    .limit(200) as { data: Player[] | null };

  const playerList = players ?? [];

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Players</h1>
              <p className="mt-3 text-brand-white/60">The global flag football player database. Rankings, stats, highlights.</p>
            </div>
            <Link
              href="/players/submit"
              className="shrink-0 inline-flex items-center gap-2 border border-brand-yellow/40 text-brand-yellow font-display text-xs uppercase tracking-widest px-4 py-2 hover:bg-brand-yellow hover:text-brand-black transition-colors mt-2"
            >
              + Submit Profile
            </Link>
          </div>
        </div>

        {playerList.length === 0 ? (
          <div className="text-center py-20 border border-brand-yellow/20 bg-[#111111]">
            <p className="font-display text-2xl uppercase text-brand-yellow mb-3">
              Player Database Coming Soon
            </p>
            <p className="text-brand-white/60 text-sm max-w-md mx-auto">
              The Talkin Flag player database is being built. Submit your profile to be the first listed.
            </p>
            <Link
              href="/players/submit"
              className="inline-block mt-6 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3 hover:bg-yellow-400 transition-colors"
            >
              Submit Your Profile
            </Link>
          </div>
        ) : (
          <PlayersFilter players={playerList} />
        )}
      </div>
    </div>
  );
}

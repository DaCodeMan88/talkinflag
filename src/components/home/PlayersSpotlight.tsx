import { createServerClient } from "@/lib/supabase";
import { PlayerCard } from "@/components/players/PlayerCard";
import Link from "next/link";
import type { Player } from "@/types/player";

export async function PlayersSpotlight() {
  const supabase = createServerClient();

  // Show top ranked players regardless of verified status
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("is_approved", true)
    .not("ranking_national", "is", null)
    .order("ranking_national", { ascending: true })
    .limit(4) as { data: Player[] | null };

  if (!players || players.length === 0) return null;

  return (
    <section className="bg-brand-black py-20 px-6 border-t border-brand-white/5" aria-label="Top ranked players">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-display text-brand-yellow text-xs uppercase tracking-[0.3em] mb-2">
              TF Rankings
            </p>
            <h2 className="font-display text-4xl md:text-6xl uppercase text-brand-white">
              Top Players
            </h2>
          </div>
          <Link
            href="/players"
            className="text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline hidden md:block"
          >
            Full Database →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/players" className="text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline">
            Full Database →
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-brand-white/10 pt-8">
          <p className="text-brand-white/40 text-sm">
            Elite flag football talent from around the world.
          </p>
          <Link
            href="/players/submit"
            className="shrink-0 inline-flex items-center gap-2 border border-brand-yellow/40 text-brand-yellow font-display text-xs uppercase tracking-widest px-4 py-2 hover:bg-brand-yellow hover:text-brand-black transition-colors"
          >
            + Submit Profile
          </Link>
        </div>

      </div>
    </section>
  );
}

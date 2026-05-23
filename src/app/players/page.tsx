import { createServerClient } from "@/lib/supabase";
import { PlayerCard } from "@/components/players/PlayerCard";
import { RankingsTable } from "@/components/players/RankingsTable";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Players | Talkin Flag — Flag Football Player Database",
  description: "The global flag football player database. Search rankings, stats, and highlights.",
};

const POSITIONS = ["QB", "WR", "DB", "LB", "C", "Rusher"];
const LEVELS = ["high_school", "college", "national", "pro"];

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ position?: string; level?: string; q?: string }>;
}) {
  const { position, level, q } = await searchParams;
  const supabase = createServerClient();

  let query = supabase
    .from("players")
    .select("*")
    .eq("is_verified", true)
    .order("ranking_national", { ascending: true, nullsFirst: false });

  if (position) query = query.eq("position", position);
  if (level) query = query.eq("level", level);
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`);

  const { data: players } = await query.limit(100);

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white">Players</h1>
          <p className="mt-3 text-brand-white/60">The global flag football player database. Rankings, stats, highlights.</p>
        </div>

        {/* Filter bar */}
        <form className="flex flex-wrap gap-3 mb-10" role="search" aria-label="Filter players">
          <label className="sr-only" htmlFor="player-search">Search by name</label>
          <input
            id="player-search"
            name="q"
            defaultValue={q}
            placeholder="Search player..."
            className="bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-2 text-sm focus:border-brand-yellow focus:outline-none"
          />
          <select
            name="position"
            defaultValue={position}
            className="bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-2 text-sm focus:border-brand-yellow focus:outline-none"
            aria-label="Filter by position"
          >
            <option value="">All Positions</option>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            name="level"
            defaultValue={level}
            className="bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-2 text-sm"
            aria-label="Filter by level"
          >
            <option value="">All Levels</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l.replace("_", " ")}</option>)}
          </select>
          <button
            type="submit"
            className="bg-brand-yellow text-brand-black px-6 py-2 font-display uppercase text-sm tracking-widest hover:bg-yellow-400 transition-colors"
          >
            Filter
          </button>
        </form>

        {!players || players.length === 0 ? (
          <div className="text-center py-20 border border-brand-yellow/20 bg-[#111111]">
            <p className="font-display text-2xl uppercase text-brand-yellow mb-3">
              {q || position || level ? "No Players Found" : "Player Database Coming Soon"}
            </p>
            <p className="text-brand-white/60 text-sm max-w-md mx-auto">
              {q || position || level
                ? "Try different search criteria."
                : "The Talkin Flag player database is being built. Submit your profile to be listed."}
            </p>
            {!q && !position && !level && (
              <a
                href="/players/submit"
                className="inline-block mt-6 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3 hover:bg-yellow-400 transition-colors"
              >
                Submit Your Profile
              </a>
            )}
          </div>
        ) : (
          <>
            <RankingsTable players={players.slice(0, 20)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {players.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

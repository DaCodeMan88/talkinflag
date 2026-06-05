import { createServerClient } from "@/lib/supabase";
import Link from "next/link";
import type { Player } from "@/types/player";

function formatLevel(level: string | null | undefined) {
  if (!level) return "";
  if (level === "high_school" || level === "youth") return "HS";
  if (level === "college") return "College";
  if (level === "national" || level === "international") return "National";
  return level;
}

export async function RankingsTeaser() {
  const supabase = createServerClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, position, school_or_team, state, grad_year, level, ranking_national, is_verified, gender")
    .not("ranking_national", "is", null)
    .eq("level", "high_school")
    .eq("gender", "female")
    .order("ranking_national", { ascending: true })
    .limit(10) as { data: Player[] | null };

  if (!players || players.length === 0) return null;

  return (
    <section className="bg-[#060606] py-20 px-6 border-t border-brand-white/5" aria-label="High school rankings">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-display text-brand-yellow text-xs uppercase tracking-[0.3em] mb-2">
              Girls High School
            </p>
            <h2 className="font-display text-4xl md:text-6xl uppercase text-brand-white">
              Top 10 Rankings
            </h2>
          </div>
          <Link
            href="/players?level=high_school"
            className="text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline hidden md:block"
          >
            Full Rankings →
          </Link>
        </div>

        {/* Rankings table */}
        <div className="divide-y divide-brand-white/5">
          {players.map((player, i) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="flex items-center gap-4 md:gap-6 py-4 group hover:bg-brand-white/[0.02] -mx-4 px-4 transition-colors"
            >
              {/* Rank */}
              <span className={`shrink-0 font-display text-lg w-7 text-right tabular-nums ${
                i === 0 ? "text-brand-yellow" : "text-brand-white/25"
              }`}>
                {player.ranking_national}
              </span>

              {/* Name + school */}
              <div className="flex-1 min-w-0">
                <span className="font-display text-sm md:text-base uppercase text-brand-white group-hover:text-brand-yellow transition-colors truncate block">
                  {player.first_name} {player.last_name}
                </span>
                <span className="text-brand-white/35 text-xs truncate block mt-0.5">
                  {player.school_or_team}{player.state ? `, ${player.state}` : ""}
                </span>
              </div>

              {/* Position */}
              {player.position && (
                <span className="shrink-0 bg-brand-black border border-brand-yellow/25 text-brand-yellow font-display text-[10px] px-2 py-0.5 uppercase tracking-widest">
                  {player.position}
                </span>
              )}

              {/* Class */}
              {player.grad_year && (
                <span className="shrink-0 text-brand-white/25 text-xs font-display hidden sm:block">
                  &#39;{String(player.grad_year).slice(2)}
                </span>
              )}

              {/* Arrow */}
              <span className="shrink-0 text-brand-yellow text-xs opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-brand-white/10 pt-6">
          <p className="text-brand-white/30 text-xs">
            Source: MaxPreps Top 100 · Updated 2025–26
          </p>
          <Link
            href="/players?level=high_school"
            className="text-brand-yellow font-display uppercase tracking-widest text-xs hover:underline"
          >
            Full Rankings →
          </Link>
        </div>

      </div>
    </section>
  );
}

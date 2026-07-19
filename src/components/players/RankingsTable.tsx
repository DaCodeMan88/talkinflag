import Link from "next/link";
import { Player } from "@/types/player";
import { COHORT_LABELS, cohortForLevel, type Cohort } from "@/lib/rankings/cohort";

export function RankingsTable({
  players,
  cohort,
  genderLabel,
}: {
  players: Player[];
  cohort: Cohort;
  genderLabel?: string; // "Women's" | "Men's" | undefined
}) {
  // Defensive: only rows that belong to this cohort AND have a rank.
  const ranked = players.filter(
    (p) => p.ranking_national != null && cohortForLevel(p.level) === cohort,
  );
  if (ranked.length === 0) return null;
  const sorted = [...ranked].sort(
    (a, b) => (a.ranking_national ?? 0) - (b.ranking_national ?? 0),
  );

  return (
    <div className="overflow-x-auto mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
          {genderLabel ? `${genderLabel} ` : ""}{COHORT_LABELS[cohort]} Rankings
        </h2>
        <span className="text-brand-white/30 text-xs">{ranked.length} ranked players</span>
      </div>
      <table className="w-full text-sm" aria-label="Player national rankings">
        <thead>
          <tr className="border-b border-brand-yellow/20">
            <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 w-12">#</th>
            <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4">Player</th>
            <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4">Pos</th>
            <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 hidden md:table-cell">Level</th>
            <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 hidden lg:table-cell">Team / Country</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((player) => (
            <tr
              key={player.id}
              className="border-b border-brand-white/5 hover:bg-brand-white/5 transition-colors group"
            >
              <td className="py-3 pr-4 text-brand-yellow font-display">
                {player.ranking_national}
              </td>
              <td className="py-3 pr-4">
                <Link
                  href={`/players/${player.id}`}
                  className="text-brand-white font-medium group-hover:text-brand-yellow transition-colors"
                >
                  {player.first_name} {player.last_name}
                  {player.is_verified && (
                    <span className="ml-2 text-brand-yellow text-xs" aria-label="Verified">✓</span>
                  )}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <span className="text-brand-yellow font-display text-xs uppercase">{player.position || "—"}</span>
              </td>
              <td className="py-3 pr-4 text-brand-white/50 text-xs hidden md:table-cell">
                {player.level === "youth" ? "High School" : player.level?.replaceAll("_", " ") || "—"}
              </td>
              <td className="py-3 text-brand-white/50 text-xs hidden lg:table-cell">
                {player.school_or_team || player.country || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

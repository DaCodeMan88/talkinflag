"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { paginate, PAGE_SIZE } from "@/lib/pagination";
import { Paginator } from "@/components/ui/Paginator";

type RankPlayer = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  level: string | null;
  school_or_team: string | null;
  country: string | null;
  is_verified: boolean | null;
  ranking_national: number | null;
  ranking_position: number | null;
};

interface RankingsCohortTableProps {
  label: string;
  players: RankPlayer[];
}

export function RankingsCohortTable({ label, players }: RankingsCohortTableProps) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [players]);

  const pagePlayers = paginate(players, page);

  return (
    <div className="mb-14">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
          {label} Rankings
        </h2>
        <span className="text-brand-white/30 text-xs">{players.length} ranked players</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={`TF ${label} player rankings`}>
          <thead>
            <tr className="border-b border-brand-yellow/20">
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-3 w-10">#</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-3">Player</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-3 w-12">Pos</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-3 hidden sm:table-cell">Pos #</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-3 hidden md:table-cell">Level</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 hidden lg:table-cell">Team</th>
            </tr>
          </thead>
          <tbody>
            {pagePlayers.map((player) => (
              <tr
                key={player.id}
                className="border-b border-brand-white/5 hover:bg-brand-white/5 transition-colors group"
              >
                <td className="py-3 pr-3 text-brand-yellow font-display tabular-nums">
                  {player.ranking_national}
                </td>
                <td className="py-3 pr-3">
                  <Link
                    href={`/players/${player.id}`}
                    className="text-brand-white font-medium group-hover:text-brand-yellow transition-colors"
                  >
                    {player.first_name} {player.last_name}
                    {player.is_verified && (
                      <span className="ml-1.5 text-brand-yellow text-xs" title="Verified profile">✓</span>
                    )}
                  </Link>
                </td>
                <td className="py-3 pr-3">
                  <span className="text-brand-yellow font-display text-xs uppercase">{player.position ?? "—"}</span>
                </td>
                <td className="py-3 pr-3 text-brand-white/40 text-xs hidden sm:table-cell tabular-nums">
                  #{player.ranking_position}
                </td>
                <td className="py-3 pr-3 text-brand-white/40 text-xs hidden md:table-cell capitalize">
                  {player.level?.replace("_", " ") ?? "—"}
                </td>
                <td className="py-3 text-brand-white/40 text-xs hidden lg:table-cell">
                  {player.school_or_team ?? player.country ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginator
        total={players.length}
        page={page}
        perPage={PAGE_SIZE}
        onPageChange={setPage}
        itemNoun="ranked players"
      />
    </div>
  );
}

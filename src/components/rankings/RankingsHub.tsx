"use client";
import { useState } from "react";
import Link from "next/link";
import {
  MENS_WORLD_RANKINGS,
  WOMENS_WORLD_RANKINGS,
  COLLEGE_RANKINGS,
  getFlag,
} from "@/lib/world-rankings";
import { RankingsTable } from "@/components/players/RankingsTable";
import type { Player } from "@/types/player";

type Tab = "players" | "world" | "college";
type Gender = "mens" | "womens";

interface RankingsHubProps {
  players: Player[];
}

export function RankingsHub({ players }: RankingsHubProps) {
  const [tab, setTab] = useState<Tab>("players");
  const [gender, setGender] = useState<Gender>("mens");

  const rankedPlayers = players.filter((p) => p.ranking_national != null);
  const worldRankings = gender === "mens" ? MENS_WORLD_RANKINGS : WOMENS_WORLD_RANKINGS;

  const tabs: { id: Tab; label: string }[] = [
    { id: "players", label: "Player Rankings" },
    { id: "world",   label: "World Rankings"  },
    { id: "college", label: "College Rankings" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-10 border-b border-brand-white/10 pb-0" role="tablist">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`font-display text-xs uppercase tracking-widest px-5 py-3 transition-colors border-b-2 -mb-px ${
              tab === id
                ? "text-brand-yellow border-brand-yellow"
                : "text-brand-white/40 border-transparent hover:text-brand-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Player Rankings ─────────────────────────────────── */}
      {tab === "players" && (
        <div>
          {rankedPlayers.length === 0 ? (
            <EmptyState
              title="Player Rankings Coming Soon"
              body="Players are being ranked. Submit a profile to get listed."
              cta={{ label: "Submit Profile", href: "/players/submit" }}
            />
          ) : (
            <>
              <RankingsTable players={rankedPlayers} />
              <div className="mt-6 text-center">
                <Link
                  href="/players"
                  className="inline-flex items-center gap-2 border border-brand-yellow/40 text-brand-yellow font-display text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-brand-yellow hover:text-brand-black transition-colors"
                >
                  View Full Player Database →
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── World Rankings ──────────────────────────────────── */}
      {tab === "world" && (
        <div>
          {/* Gender toggle */}
          <div className="flex items-center gap-2 mb-6" role="group" aria-label="Filter by gender">
            {(["mens", "womens"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`font-display text-xs uppercase tracking-widest px-4 py-2 transition-colors ${
                  gender === g
                    ? "bg-brand-yellow text-brand-black"
                    : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
                }`}
              >
                {g === "mens" ? "Men's" : "Women's"}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
              {gender === "mens" ? "Men's" : "Women's"} 2025 IFAF Flag Football World Rankings
            </h2>
            <a
              href="https://www.americanfootball.sport/ifaf-world-rankings/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-white/30 font-display text-[10px] uppercase tracking-widest hover:text-brand-yellow transition-colors"
            >
              Source: IFAF ↗
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label={`${gender === "mens" ? "Men's" : "Women's"} IFAF world rankings`}>
              <thead>
                <tr className="border-b border-brand-yellow/20">
                  <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 w-12">#</th>
                  <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4">Nation</th>
                  <th className="text-right font-display text-xs uppercase tracking-widest text-brand-yellow pb-3">Points</th>
                </tr>
              </thead>
              <tbody>
                {worldRankings.map((team, i) => (
                  <tr
                    key={`${team.nation}-${i}`}
                    className="border-b border-brand-white/5 hover:bg-brand-white/5 transition-colors"
                  >
                    <td className="py-3 pr-4 text-brand-yellow font-display">{team.rank}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-3 text-brand-white">
                        <span className="text-lg leading-none" aria-hidden="true">{getFlag(team.nation)}</span>
                        {team.nation}
                      </span>
                    </td>
                    <td className="py-3 text-right text-brand-white/60 tabular-nums">
                      {team.points.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-brand-white/25 text-xs">
            Rankings updated annually by IFAF based on results in international competition.
          </p>
        </div>
      )}

      {/* ── College Rankings ────────────────────────────────── */}
      {tab === "college" && (
        <div>
          {COLLEGE_RANKINGS.length === 0 ? (
            <EmptyState
              title="College Rankings Coming Soon"
              body="College team rankings will be published here once the season data is sourced. Check back soon."
            />
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
                  College Team Rankings
                </h2>
              </div>
              <table className="w-full text-sm" aria-label="College flag football rankings">
                <thead>
                  <tr className="border-b border-brand-yellow/20">
                    <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 w-12">#</th>
                    <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4">Team</th>
                    <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 hidden md:table-cell">Conference</th>
                    <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 hidden sm:table-cell">Record</th>
                  </tr>
                </thead>
                <tbody>
                  {COLLEGE_RANKINGS.map((team) => (
                    <tr key={team.rank} className="border-b border-brand-white/5 hover:bg-brand-white/5 transition-colors">
                      <td className="py-3 pr-4 text-brand-yellow font-display">{team.rank}</td>
                      <td className="py-3 pr-4 text-brand-white font-medium">{team.team}</td>
                      <td className="py-3 pr-4 text-brand-white/50 text-xs hidden md:table-cell">{team.conference ?? "—"}</td>
                      <td className="py-3 text-brand-white/50 text-xs hidden sm:table-cell">{team.record ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="text-center py-20 border border-brand-yellow/20 bg-[#111111]">
      <p className="font-display text-xl uppercase text-brand-yellow mb-3">{title}</p>
      <p className="text-brand-white/60 text-sm max-w-md mx-auto">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-block mt-6 border border-brand-yellow/40 text-brand-yellow font-display uppercase tracking-widest text-sm px-6 py-3 hover:bg-brand-yellow hover:text-brand-black transition-colors"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

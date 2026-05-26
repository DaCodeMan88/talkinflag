"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MENS_WORLD_RANKINGS,
  WOMENS_WORLD_RANKINGS,
  COLLEGE_PROGRAMS,
  getFlag,
} from "@/lib/world-rankings";
import { RankingsTable } from "@/components/players/RankingsTable";
import type { Player } from "@/types/player";

type Tab = "players" | "world" | "college";
type Gender = "mens" | "womens";
type Division = "All" | "DI" | "DII" | "DIII";
type RankTier = "national" | "college" | "world";

interface RankingsHubProps {
  players: Player[];
}

export function RankingsHub({ players }: RankingsHubProps) {
  const [tab, setTab] = useState<Tab>("players");
  const [rankTier, setRankTier] = useState<RankTier>("national");
  const [gender, setGender] = useState<Gender>("mens");
  const [division, setDivision] = useState<Division>("All");
  const [search, setSearch] = useState("");

  const worldRankings = gender === "mens" ? MENS_WORLD_RANKINGS : WOMENS_WORLD_RANKINGS;

  // Separate player pools by ranking tier
  const nationalPlayers = players.filter(
    (p) => p.ranking_national != null && (p.level === "high_school" || p.level === "youth" || p.level === "national" || p.level == null)
  );
  const collegePlayers = players.filter(
    (p) => p.ranking_national != null && p.level === "college"
  );
  const worldPlayers = players.filter(
    (p) => p.ranking_national != null && (p.level === "national" || p.level === "international")
  );

  // All ranked players for when tier has no matches yet
  const allRankedPlayers = players.filter((p) => p.ranking_national != null);

  const tierPlayers: Record<RankTier, Player[]> = {
    national: nationalPlayers.length > 0 ? nationalPlayers : allRankedPlayers,
    college:  collegePlayers,
    world:    worldPlayers,
  };

  const tierLabels: Record<RankTier, string> = {
    national: "National Rankings",
    college:  "College Rankings",
    world:    "World Player Rankings",
  };

  const tierDescriptions: Record<RankTier, string> = {
    national: "Top high school players ranked nationally.",
    college:  "Top players competing at the college level.",
    world:    "Players competing for IFAF-recognized national teams.",
  };

  const filteredPrograms = useMemo(() => {
    let list = COLLEGE_PROGRAMS;
    if (division !== "All") list = list.filter((p) => p.division === division);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.school.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          (p.conference?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [division, search]);

  const counts: Record<Division, number> = useMemo(() => ({
    All:  COLLEGE_PROGRAMS.length,
    DI:   COLLEGE_PROGRAMS.filter((p) => p.division === "DI").length,
    DII:  COLLEGE_PROGRAMS.filter((p) => p.division === "DII").length,
    DIII: COLLEGE_PROGRAMS.filter((p) => p.division === "DIII").length,
  }), []);

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
          {/* Tier sub-tabs */}
          <div className="flex gap-1 mb-8" role="group" aria-label="Ranking tier">
            {(["national", "college", "world"] as RankTier[]).map((t) => (
              <button
                key={t}
                onClick={() => setRankTier(t)}
                className={`font-display text-xs uppercase tracking-widest px-4 py-2 transition-colors ${
                  rankTier === t
                    ? "bg-brand-yellow text-brand-black"
                    : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
                }`}
              >
                {t === "national" ? "National" : t === "college" ? "College" : "World"}
              </button>
            ))}
          </div>

          {/* Tier description */}
          <p className="text-brand-white/40 text-xs mb-6">{tierDescriptions[rankTier]}</p>

          {tierPlayers[rankTier].length === 0 ? (
            <EmptyState
              title={`${rankTier.charAt(0).toUpperCase() + rankTier.slice(1)} Rankings Coming Soon`}
              body="Players are being ranked. Submit a profile to get listed."
              cta={{ label: "Submit Profile", href: "/players/submit" }}
            />
          ) : (
            <>
              <RankingsTable
                players={tierPlayers[rankTier]}
                title={tierLabels[rankTier]}
              />
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

      {/* ── College Programs ────────────────────────────────── */}
      {tab === "college" && (
        <div>
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
                NCAA Women&apos;s Flag Football Programs
              </h2>
              <p className="text-brand-white/40 text-xs mt-1">
                Flag football is an NCAA Emerging Sport for Women (adopted January 2026). {COLLEGE_PROGRAMS.length} programs listed.
              </p>
            </div>
            <a
              href="https://www.collegiateflagfootball.com/college-flag-football-teams/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-white/30 font-display text-[10px] uppercase tracking-widest hover:text-brand-yellow transition-colors shrink-0"
            >
              Source ↗
            </a>
          </div>

          {/* Division filter + search */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex gap-1" role="group" aria-label="Filter by division">
              {(["All", "DI", "DII", "DIII"] as Division[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDivision(d)}
                  className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 transition-colors ${
                    division === d
                      ? "bg-brand-yellow text-brand-black"
                      : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
                  }`}
                >
                  {d} <span className="opacity-60">({counts[d]})</span>
                </button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search school, state, conference…"
              aria-label="Search programs"
              className="flex-1 min-w-[180px] bg-[#111111] border border-brand-white/15 text-brand-white px-3 py-1.5 text-xs focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="NCAA women's flag football programs">
              <thead>
                <tr className="border-b border-brand-yellow/20">
                  <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4">School</th>
                  <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 w-10">St.</th>
                  <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 w-16">Div.</th>
                  <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 hidden sm:table-cell">Conference</th>
                  <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 hidden md:table-cell">2026 Record</th>
                  <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 hidden lg:table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-brand-white/40 text-xs">
                      No programs match your search.
                    </td>
                  </tr>
                ) : (
                  filteredPrograms.map((prog, i) => (
                    <tr
                      key={`${prog.school}-${i}`}
                      className="border-b border-brand-white/5 hover:bg-brand-white/5 transition-colors"
                    >
                      <td className="py-3 pr-4 text-brand-white font-medium">{prog.school}</td>
                      <td className="py-3 pr-4 text-brand-white/50 text-xs">{prog.state}</td>
                      <td className="py-3 pr-4">
                        <span className={`font-display text-[10px] uppercase tracking-widest px-1.5 py-0.5 ${
                          prog.division === "DI"   ? "bg-brand-yellow/20 text-brand-yellow" :
                          prog.division === "DII"  ? "bg-blue-500/20 text-blue-300" :
                                                     "bg-brand-white/10 text-brand-white/60"
                        }`}>
                          {prog.division}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-brand-white/50 text-xs hidden sm:table-cell">{prog.conference ?? "—"}</td>
                      <td className="py-3 pr-4 text-brand-white/50 text-xs hidden md:table-cell">{prog.record ?? "—"}</td>
                      <td className="py-3 hidden lg:table-cell">
                        <span className={`font-display text-[10px] uppercase tracking-widest ${
                          prog.status === "Competing" ? "text-green-400" : "text-brand-white/30"
                        }`}>
                          {prog.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-brand-white/25 text-xs">
            Data sourced from collegiateflagfootball.com and conference sites. Records reflect Spring 2026 season where available.
          </p>
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

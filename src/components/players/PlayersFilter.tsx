"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, Globe } from "lucide-react";
import { PlayerCard } from "./PlayerCard";
import { RankingsTable } from "./RankingsTable";
import Link from "next/link";
import type { Player } from "@/types/player";
import { COHORT_LABELS, cohortForLevel } from "@/lib/rankings/cohort";

const POSITIONS = ["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"];

interface PlayersFilterProps {
  players: Player[];
}

export function PlayersFilter({ players }: PlayersFilterProps) {
  const searchParams = useSearchParams();
  // Allow URL params to seed the initial filter state (e.g. ?position=QB from player detail pages)
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [position, setPosition] = useState(searchParams.get("position") ?? "");
  const [level, setLevel] = useState(searchParams.get("level") ?? "");
  const [country, setCountry] = useState(searchParams.get("country") ?? "");
  const [gender, setGender] = useState(searchParams.get("gender") ?? "");
  const [gradYear, setGradYear] = useState(searchParams.get("gradYear") ?? "");

  // Derive unique countries from the player list (sorted, non-null)
  const countries = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => { if (p.country) set.add(p.country); });
    return Array.from(set).sort();
  }, [players]);

  // Derive unique grad years from the player list (sorted ascending, non-null)
  const gradYears = useMemo(() => {
    const set = new Set<number>();
    players.forEach((p) => { if (p.grad_year != null) set.add(p.grad_year); });
    return Array.from(set).sort((a, b) => a - b);
  }, [players]);

  // Per-cohort/level counts for the segmented control
  const counts = useMemo(() => {
    const hs = players.filter((p) => cohortForLevel(p.level) === "hs").length;
    const college = players.filter((p) => p.level === "college").length;
    const world = players.filter((p) => p.level === "national" || p.level === "international").length;
    return { all: players.length, hs, college, world };
  }, [players]);

  // Top-5 leaderboards per cohort for the All Players view
  const top5 = useMemo(() => {
    const ranked = players.filter((p) => p.ranking_national != null);
    const take = (pred: (p: Player) => boolean) =>
      ranked.filter(pred).sort((a, b) => a.ranking_national! - b.ranking_national!).slice(0, 5);
    return {
      hs: take((p) => cohortForLevel(p.level) === "hs"),
      cw: take((p) => cohortForLevel(p.level) === "cw"),
    };
  }, [players]);

  const filtered = useMemo(() => {
    let result = players;

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q) ||
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
          (p.school_or_team?.toLowerCase().includes(q) ?? false) ||
          (p.country?.toLowerCase().includes(q) ?? false)
      );
    }

    // Position filter
    if (position) {
      result = result.filter((p) => p.position === position);
    }

    // Level filter
    if (level) {
      if (level === "high_school") {
        result = result.filter((p) => p.level === "high_school" || p.level === "youth");
      } else if (level === "world") {
        result = result.filter((p) => p.level === "national" || p.level === "international");
      } else if (level === "cw") {
        // Full College / World cohort — includes null/other levels so every
        // player shown in the CW Top-5 card is reachable here.
        result = result.filter((p) => cohortForLevel(p.level) === "cw");
      } else {
        result = result.filter((p) => p.level === level);
      }
    }

    // Country filter
    if (country) {
      result = result.filter((p) => p.country === country);
    }

    // Gender filter
    if (gender) {
      result = result.filter((p) => p.gender === gender);
    }

    // Class year filter
    if (gradYear) {
      result = result.filter((p) => p.grad_year === Number(gradYear));
    }

    return result;
  }, [players, query, position, level, country, gender, gradYear]);

  const rankedFiltered = useMemo(
    () => filtered.filter((p) => p.ranking_national != null),
    [filtered]
  );

  const hasAnyFilter = query.trim() !== "" || position !== "" || level !== "" || country !== "" || gender !== "" || gradYear !== "";

  function clearAll() {
    setQuery("");
    setPosition("");
    setLevel("");
    setCountry("");
    setGender("");
    setGradYear("");
  }

  return (
    <div>
      {/* Search + filter bar */}
      <div className="sticky top-16 md:top-20 z-20 bg-brand-black/95 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-2 pb-3 border-b border-brand-white/10 mb-8">
      <div className="space-y-3">
        {/* Gender toggle */}
        <div className="flex items-center gap-2" role="group" aria-label="Filter by gender">
          {(["", "male", "female"] as const).map((g) => {
            const label = g === "" ? "All" : g === "male" ? "Men's / Boys'" : "Women's / Girls'";
            return (
              <button
                key={g}
                onClick={() => setGender(g === gender ? "" : g)}
                className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 transition-colors ${
                  gender === g
                    ? "bg-brand-yellow text-brand-black"
                    : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Text search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-white/30 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, team, or country…"
            aria-label="Search players"
            className="w-full bg-[#111111] border border-brand-white/15 text-brand-white pl-10 pr-10 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/30"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-white/40 hover:text-brand-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter pills row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Position pills */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by position">
            <button
              onClick={() => setPosition("")}
              className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 transition-colors ${
                position === ""
                  ? "bg-brand-yellow text-brand-black"
                  : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
              }`}
            >
              All
            </button>
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setPosition(pos === position ? "" : pos)}
                className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 transition-colors ${
                  position === pos
                    ? "bg-brand-yellow text-brand-black"
                    : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-brand-white/10 hidden sm:block" aria-hidden="true" />

          {/* Cohort segmented control */}
          <div className="flex flex-wrap items-stretch gap-1.5" role="group" aria-label="Browse by level">
            <SegBtn active={level === ""} onClick={() => setLevel("")} label="All Players" count={counts.all} />
            <SegBtn active={level === "high_school"} onClick={() => setLevel(level === "high_school" ? "" : "high_school")} label="High School (18U)" count={counts.hs} />
            <div className="w-px self-stretch bg-brand-white/15 mx-1" aria-hidden="true" />
            <div
              className={`flex gap-1.5 border p-1 -m-1 ${
                level === "cw" || level === "college" || level === "world"
                  ? "border-brand-yellow/40"
                  : "border-brand-white/10"
              }`}
              role="group"
              aria-label="College and World players are ranked together in one pool"
              title="College and World players are ranked together in one pool"
            >
              <SegBtn active={level === "college"} onClick={() => setLevel(level === "college" ? "" : "college")} label="College" count={counts.college} />
              <SegBtn active={level === "world"} onClick={() => setLevel(level === "world" ? "" : "world")} label="World" count={counts.world} />
            </div>
          </div>
        </div>
        {/* Class year filter — only shown when multiple grad years present */}
        {gradYears.length > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-brand-white/30 text-xs font-display uppercase tracking-widest shrink-0">Class</span>
            <div className="relative">
              <select
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                aria-label="Filter by class year"
                className="appearance-none bg-[#111111] border border-brand-white/15 text-brand-white/70 pl-3 pr-8 py-1.5 text-xs font-display uppercase tracking-widest focus:border-brand-yellow focus:outline-none cursor-pointer"
              >
                <option value="">All Years</option>
                {gradYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-brand-white/40">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" aria-hidden="true">
                  <path d="M0 0l5 6 5-6z" />
                </svg>
              </div>
            </div>
            {gradYear && (
              <button
                onClick={() => setGradYear("")}
                aria-label="Clear class year filter"
                className="text-brand-white/40 hover:text-brand-yellow transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Country filter — only shown when multiple countries present */}
        {countries.length > 1 && (
          <div className="flex items-center gap-3">
            <Globe size={14} className="text-brand-white/30 shrink-0" aria-hidden="true" />
            <div className="relative">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                aria-label="Filter by country"
                className="appearance-none bg-[#111111] border border-brand-white/15 text-brand-white/70 pl-3 pr-8 py-1.5 text-xs font-display uppercase tracking-widest focus:border-brand-yellow focus:outline-none cursor-pointer"
              >
                <option value="">All Countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-brand-white/40">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" aria-hidden="true">
                  <path d="M0 0l5 6 5-6z" />
                </svg>
              </div>
            </div>
            {country && (
              <button
                onClick={() => setCountry("")}
                aria-label="Clear country filter"
                className="text-brand-white/40 hover:text-brand-yellow transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Results summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 min-h-[1.5rem]">
        <p className="text-brand-white/40 text-xs font-display uppercase tracking-widest">
          {filtered.length === players.length
            ? `${players.length} player${players.length === 1 ? "" : "s"}`
            : `${filtered.length} of ${players.length} player${players.length === 1 ? "" : "s"}`}
        </p>
        {hasAnyFilter && (
          <div className="flex flex-wrap items-center gap-1.5">
            {gender && (
              <Chip
                label={gender === "male" ? "Men's / Boys'" : "Women's / Girls'"}
                onClear={() => setGender("")}
              />
            )}
            {level && (
              <Chip
                label={level === "high_school" ? "High School (18U)" : level === "world" ? "World" : level === "cw" ? COHORT_LABELS.cw : "College"}
                onClear={() => setLevel("")}
              />
            )}
            {position && <Chip label={position} onClear={() => setPosition("")} />}
            {country && <Chip label={country} onClear={() => setCountry("")} />}
            {gradYear && <Chip label={`Class of ${gradYear}`} onClear={() => setGradYear("")} />}
            {query.trim() && <Chip label={`"${query.trim()}"`} onClear={() => setQuery("")} />}
            <button
              onClick={clearAll}
              className="text-brand-white/40 hover:text-brand-yellow font-display text-xs uppercase tracking-widest transition-colors ml-1"
            >
              × Clear all
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-brand-yellow/20 bg-[#111111]">
          <p className="font-display text-xl uppercase text-brand-yellow mb-3">No Players Found</p>
          <p className="text-brand-white/60 text-sm max-w-md mx-auto">
            Try different search criteria.
          </p>
          <button
            onClick={clearAll}
            className="inline-block mt-6 text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Rankings — dual top-5 leaderboards in All view; cohort table when a level is selected.
              Never render a mixed-cohort ranked table. */}
          {level === "" ? (
            (top5.hs.length > 0 || top5.cw.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {([["hs", "high_school"], ["cw", "cw"]] as const).map(([cohort, linkLevel]) =>
                  top5[cohort].length > 0 ? (
                    <div key={cohort} className="border border-brand-white/10 bg-[#0d0d0d] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display text-xs uppercase tracking-widest text-brand-yellow">
                          {COHORT_LABELS[cohort]} Top 5
                        </h3>
                        <button
                          onClick={() => setLevel(linkLevel)}
                          className="text-brand-white/40 hover:text-brand-yellow text-xs font-display uppercase tracking-widest transition-colors"
                        >
                          Full rankings →
                        </button>
                      </div>
                      <ol className="space-y-2">
                        {top5[cohort].map((p) => (
                          <li key={p.id} className="flex items-center gap-3">
                            <span className="text-brand-yellow font-display text-sm w-6 text-right tabular-nums">
                              {p.ranking_national}
                            </span>
                            <Link
                              href={`/players/${p.id}`}
                              className="text-brand-white text-sm hover:text-brand-yellow transition-colors truncate"
                            >
                              {p.first_name} {p.last_name}
                            </Link>
                            {p.position && (
                              <span className="text-brand-white/30 text-xs uppercase font-display ml-auto shrink-0">
                                {p.position}
                              </span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null
                )}
              </div>
            )
          ) : (
            rankedFiltered.length > 0 && (
              <RankingsTable
                players={rankedFiltered}
                cohort={level === "high_school" ? "hs" : "cw"}
                genderLabel={gender === "female" ? "Women's" : gender === "male" ? "Men's" : undefined}
              />
            )
          )}

          {/* Player grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </>
      )}

      {/* Submit CTA */}
      <div className="mt-14 border-t border-brand-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-brand-white/40 text-sm text-center sm:text-left">
          Don&apos;t see yourself? Get listed in the global database.
        </p>
        <Link
          href="/players/submit"
          className="shrink-0 inline-flex items-center gap-2 border border-brand-yellow/40 text-brand-yellow font-display text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-brand-yellow hover:text-brand-black transition-colors"
        >
          + Submit Profile
        </Link>
      </div>
    </div>
  );
}

function SegBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
        active
          ? "bg-brand-yellow text-brand-black"
          : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
      }`}
    >
      {label}
      <span className={`text-[10px] tabular-nums ${active ? "text-brand-black/60" : "text-brand-white/30"}`}>{count}</span>
    </button>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-xs font-display uppercase tracking-widest px-2.5 py-1">
      {label}
      <button onClick={onClear} aria-label={`Remove ${label} filter`} className="hover:text-brand-white transition-colors">
        <X size={11} />
      </button>
    </span>
  );
}

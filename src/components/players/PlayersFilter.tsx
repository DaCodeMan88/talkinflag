"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, Globe } from "lucide-react";
import { PlayerCard } from "./PlayerCard";
import { RankingsTable } from "./RankingsTable";
import Link from "next/link";
import type { Player } from "@/types/player";

const POSITIONS = ["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"];
const LEVELS: { value: string; label: string }[] = [
  { value: "youth", label: "Youth" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
  { value: "national", label: "National" },
  { value: "international", label: "International" },
  { value: "pro", label: "Pro" },
];

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
      result = result.filter((p) => p.level === level);
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
      <div className="space-y-3 mb-8">
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

          {/* Level pills */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by level">
            {LEVELS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLevel(value === level ? "" : value)}
                className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 transition-colors ${
                  level === value
                    ? "bg-brand-yellow text-brand-black"
                    : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
                }`}
              >
                {label}
              </button>
            ))}
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

      {/* Results summary */}
      <div className="flex items-center justify-between mb-6 min-h-[1.5rem]">
        <p className="text-brand-white/40 text-xs font-display uppercase tracking-widest">
          {filtered.length === players.length
            ? `${players.length} player${players.length === 1 ? "" : "s"}`
            : `${filtered.length} of ${players.length} player${players.length === 1 ? "" : "s"}`}
        </p>
        {hasAnyFilter && (
          <button
            onClick={clearAll}
            className="text-brand-white/40 hover:text-brand-yellow font-display text-xs uppercase tracking-widest transition-colors"
          >
            × Clear filters
          </button>
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
          {/* Rankings table — only for currently filtered ranked players */}
          {rankedFiltered.length > 0 && (
            <>
              {gender && (
                <p className="font-display text-xs uppercase tracking-widest text-brand-white/40 mb-2">
                  {gender === "female" ? "Women's Rankings" : "Men's Rankings"}
                </p>
              )}
              <RankingsTable players={rankedFiltered} />
            </>
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

"use client";
import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";

type Coach = {
  id: string;
  first_name: string;
  last_name: string;
  team: string | null;
  level: string | null;
  title: string | null;
  wins: number | null;
  losses: number | null;
};

const LEVELS: { value: string; label: string }[] = [
  { value: "youth", label: "Youth" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
  { value: "semi_pro", label: "Semi-Pro" },
  { value: "professional", label: "Professional" },
  { value: "national", label: "National Team" },
];

function levelLabel(level: string | null): string {
  return LEVELS.find((l) => l.value === level)?.label ?? (level?.replaceAll("_", " ") ?? "");
}

export function CoachesFilter({ coaches }: { coaches: Coach[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");

  const presentLevels = useMemo(() => {
    const set = new Set<string>();
    coaches.forEach((c) => { if (c.level) set.add(c.level); });
    return LEVELS.filter((l) => set.has(l.value));
  }, [coaches]);

  const filtered = useMemo(() => {
    let result = coaches;
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (c) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
          (c.team?.toLowerCase().includes(q) ?? false)
      );
    }
    if (level) {
      result = result.filter((c) => c.level === level);
    }
    return result;
  }, [coaches, query, level]);

  const hasFilter = query.trim() !== "" || level !== "";

  return (
    <div>
      {/* Search + level filter */}
      <div className="space-y-3 mb-8">
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
            placeholder="Search by name or team…"
            aria-label="Search coaches"
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

        {presentLevels.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by level">
            <button
              onClick={() => setLevel("")}
              className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 transition-colors ${
                level === ""
                  ? "bg-brand-yellow text-brand-black"
                  : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
              }`}
            >
              All
            </button>
            {presentLevels.map(({ value, label }) => (
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
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-6 min-h-[1.5rem]">
        <p className="text-brand-white/40 text-xs font-display uppercase tracking-widest">
          {filtered.length === coaches.length
            ? `${coaches.length} coach${coaches.length === 1 ? "" : "es"}`
            : `${filtered.length} of ${coaches.length} coach${coaches.length === 1 ? "" : "es"}`}
        </p>
        {hasFilter && (
          <button
            onClick={() => { setQuery(""); setLevel(""); }}
            className="text-brand-white/40 hover:text-brand-yellow font-display text-xs uppercase tracking-widest transition-colors"
          >
            × Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-brand-yellow/20 bg-[#111111]">
          <p className="font-display text-xl uppercase text-brand-yellow mb-3">No Coaches Found</p>
          <p className="text-brand-white/60 text-sm">Try different search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((coach) => {
            const hasRecord = coach.wins !== null || coach.losses !== null;
            return (
              <Link
                key={coach.id}
                href={`/coaches/${coach.id}`}
                className="group block bg-[#0d0d0d] border border-brand-white/10 hover:border-brand-yellow/40 transition-colors p-5"
              >
                {coach.level && (
                  <span className="inline-block bg-brand-yellow text-brand-black text-xs font-display uppercase tracking-widest px-2 py-0.5 mb-3">
                    {levelLabel(coach.level)}
                  </span>
                )}
                <h2 className="font-display text-xl uppercase text-brand-white group-hover:text-brand-yellow transition-colors leading-tight">
                  {coach.first_name} {coach.last_name}
                </h2>
                {coach.team && (
                  <p className="text-brand-white/50 text-sm mt-1">{coach.team}</p>
                )}
                {coach.title && (
                  <p className="text-brand-white/30 text-xs mt-0.5">{coach.title}</p>
                )}
                {hasRecord && (
                  <p className="text-brand-white/40 text-xs font-display uppercase tracking-widest mt-3">
                    {coach.wins ?? "—"}–{coach.losses ?? "—"} record
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-14 border-t border-brand-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-brand-white/40 text-sm text-center sm:text-left">
          Are you a coach? Get your verified profile listed.
        </p>
        <Link
          href="/coaches/apply"
          className="shrink-0 inline-flex items-center gap-2 border border-brand-yellow/40 text-brand-yellow font-display text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-brand-yellow hover:text-brand-black transition-colors"
        >
          + Apply as Coach
        </Link>
      </div>
    </div>
  );
}

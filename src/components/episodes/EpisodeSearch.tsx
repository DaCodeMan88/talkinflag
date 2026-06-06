"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { EpisodeCard } from "./EpisodeCard";
import type { Episode } from "@/types/episode";

export function EpisodeSearch({ episodes }: { episodes: Episode[] }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [tag, setTag] = useState("All");

  // Derive unique tags present across all episodes, in frequency order
  const availableTags = useMemo(() => {
    const freq = new Map<string, number>();
    episodes.forEach((ep) => {
      ep.tags?.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1));
    });
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, [episodes]);

  const filtered = useMemo(() => {
    return episodes.filter((ep) => {
      const matchesSearch = !query.trim() ||
        ep.title.toLowerCase().includes(query.toLowerCase()) ||
        (ep.guestName?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
        ep.description.toLowerCase().includes(query.toLowerCase()) ||
        (ep.episodeNumber ? `ep ${ep.episodeNumber}`.includes(query.toLowerCase()) : false);
      const matchesTag = tag === "All" || (ep.tags?.includes(tag) ?? false);
      return matchesSearch && matchesTag;
    });
  }, [query, tag, episodes]);

  const hasFilter = query.trim() !== "" || tag !== "All";

  return (
    <div>
      {/* Tag filter pills */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setTag("All")}
            className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors ${
              tag === "All"
                ? "bg-brand-yellow text-brand-black border-brand-yellow"
                : "border-brand-white/20 text-brand-white/50 hover:border-brand-white/40 hover:text-brand-white"
            }`}
          >
            All
          </button>
          {availableTags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t === tag ? "All" : t)}
              className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                tag === t
                  ? "bg-brand-yellow text-brand-black border-brand-yellow"
                  : "border-brand-white/20 text-brand-white/50 hover:border-brand-white/40 hover:text-brand-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Search bar */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-white/30 pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by guest, topic, or episode number…"
          aria-label="Search episodes"
          className="w-full bg-[#111111] border border-brand-white/15 text-brand-white pl-10 pr-10 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/30"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-white/40 hover:text-brand-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results summary */}
      {hasFilter && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-brand-white/40 text-xs font-display uppercase tracking-widest">
            {filtered.length === 0 ? "No episodes found" : `${filtered.length} episode${filtered.length === 1 ? "" : "s"}`}
          </p>
          <button
            onClick={() => { setQuery(""); setTag("All"); }}
            className="text-brand-white/30 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
          >
            × Clear
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-brand-white/10">
          <p className="text-brand-white/40 text-sm">No episodes match your filters.</p>
          <button onClick={() => { setQuery(""); setTag("All"); }} className="mt-4 text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((ep) => <EpisodeCard key={ep.id} episode={ep} />)}
        </div>
      )}
    </div>
  );
}

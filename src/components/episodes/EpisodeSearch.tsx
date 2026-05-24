"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { EpisodeCard } from "./EpisodeCard";
import type { Episode } from "@/types/episode";

interface EpisodeSearchProps {
  episodes: Episode[];
}

export function EpisodeSearch({ episodes }: EpisodeSearchProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const filtered = useMemo(() => {
    if (!query.trim()) return episodes;
    const q = query.toLowerCase().trim();
    return episodes.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        (ep.guestName?.toLowerCase().includes(q) ?? false) ||
        ep.description.toLowerCase().includes(q) ||
        (ep.episodeNumber ? `ep ${ep.episodeNumber}`.includes(q) : false)
    );
  }, [query, episodes]);

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-8">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-white/30 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search episodes by guest, topic, or episode number…"
          aria-label="Search episodes"
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

      {/* Results count */}
      {query && (
        <p className="text-brand-white/40 text-xs font-display uppercase tracking-widest mb-4">
          {filtered.length === 0
            ? "No episodes found"
            : `${filtered.length} episode${filtered.length === 1 ? "" : "s"} found`}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-brand-white/10">
          <p className="text-brand-white/40 text-sm">
            No episodes match &ldquo;{query}&rdquo;
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-4 text-brand-yellow font-display text-xs uppercase tracking-widest hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      )}
    </div>
  );
}

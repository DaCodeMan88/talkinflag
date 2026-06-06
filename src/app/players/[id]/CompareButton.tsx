"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  school_or_team: string | null;
  photo_url: string | null;
};

export function CompareButton({ currentId }: { currentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/players/search?q=${encodeURIComponent(query)}&exclude=${currentId}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => { setResults(data.players ?? []); setLoading(false); })
      .catch(() => setLoading(false));
    return () => controller.abort();
  }, [query, currentId]);

  function handleSelect(otherId: string) {
    setOpen(false);
    router.push(`/players/compare?a=${currentId}&b=${otherId}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-brand-white/15 text-brand-white/40 hover:text-brand-white hover:border-brand-white/30 font-display uppercase tracking-widest text-xs px-4 py-2.5 transition-colors"
      >
        Compare
      </button>

      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-[#111] border border-white/10 w-full max-w-md p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg uppercase text-white tracking-wide">
                Compare With…
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-white/30 hover:text-white transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Search input */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players by name or team…"
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#FDDD58]/50 placeholder:text-white/20"
            />

            {/* Results */}
            <div className="max-h-72 overflow-y-auto -mx-6 px-6">
              {loading && (
                <p className="text-white/30 text-sm text-center py-4">Searching…</p>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <p className="text-white/30 text-sm text-center py-4">No players found.</p>
              )}
              {!loading && results.length > 0 && (
                <div className="space-y-1">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(p.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      {p.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photo_url}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover object-top shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                          <span className="text-white/30 text-xs font-display">
                            {p.first_name[0]}{p.last_name[0]}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="text-white/30 text-xs truncate">
                          {[p.position, p.school_or_team].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className="ml-auto text-[#FDDD58] text-xs shrink-0">Compare →</span>
                    </button>
                  ))}
                </div>
              )}
              {query.length < 2 && (
                <p className="text-white/20 text-xs text-center py-4">
                  Type at least 2 characters to search
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { setFeaturedAthlete, removeFeaturedAthlete } from "./actions";

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  school_or_team: string | null;
  photo_url: string | null;
};

type FeaturedRow = {
  id: string;
  player_id: string;
  featured_from: string;
  featured_until: string;
  message: string | null;
  players: Player | null;
};

export function FeaturedForm({
  players,
  current,
}: {
  players: Player[];
  current: FeaturedRow | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      (p.school_or_team ?? "").toLowerCase().includes(q)
    );
  });

  const selected = players.find((p) => p.id === selectedId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await setFeaturedAthlete(fd);
        setSuccess(true);
        setSelectedId("");
        setSearch("");
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      try {
        await removeFeaturedAthlete(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove");
      }
    });
  }

  // Time remaining
  function timeRemaining(until: string) {
    const diff = new Date(until).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  }

  return (
    <div className="space-y-10">
      {/* Current Featured */}
      <section>
        <h2 className="font-display text-lg uppercase tracking-widest text-white/60 mb-4">
          Currently Featured
        </h2>
        {current ? (
          <div className="bg-[#0d0d0d] border border-[#FDDD58]/30 p-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {current.players?.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.players.photo_url}
                  alt=""
                  className="w-14 h-14 object-cover rounded-full border border-white/10"
                />
              ) : (
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white/30 text-xl font-display">
                  {current.players?.first_name?.[0]}
                </div>
              )}
              <div>
                <p className="font-display text-white text-lg uppercase tracking-wide">
                  {current.players
                    ? `${current.players.first_name} ${current.players.last_name}`
                    : "Unknown"}
                </p>
                <p className="text-white/40 text-xs mt-0.5">
                  {[current.players?.position, current.players?.school_or_team]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {current.message && (
                  <p className="text-white/60 text-sm mt-1 italic">"{current.message}"</p>
                )}
                <p className="text-[#FDDD58] text-xs font-display uppercase tracking-widest mt-1.5">
                  {timeRemaining(current.featured_until)}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleRemove(current.id)}
              disabled={isPending}
              className="text-white/30 hover:text-red-400 transition-colors text-xs font-display uppercase tracking-widest shrink-0"
            >
              Remove
            </button>
          </div>
        ) : (
          <p className="text-white/30 text-sm">No active featured athlete.</p>
        )}
      </section>

      {/* Set New Featured */}
      <section>
        <h2 className="font-display text-lg uppercase tracking-widest text-white/60 mb-4">
          Set New Featured Athlete
        </h2>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          {/* Player search */}
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-widest mb-2">
              Search Players
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or team…"
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#FDDD58]/50"
            />
          </div>

          {/* Player list */}
          {search.length >= 2 && (
            <div className="max-h-56 overflow-y-auto border border-white/10 divide-y divide-white/5">
              {filtered.length === 0 ? (
                <p className="text-white/30 text-sm p-4">No players found.</p>
              ) : (
                filtered.slice(0, 20).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(p.id);
                      setSearch(`${p.first_name} ${p.last_name}`);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${
                      selectedId === p.id ? "bg-[#FDDD58]/10" : ""
                    }`}
                  >
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs">
                        {p.first_name[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-white/40 text-xs">
                        {[p.position, p.school_or_team].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {selectedId === p.id && (
                      <span className="ml-auto text-[#FDDD58] text-xs">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Hidden player_id */}
          <input type="hidden" name="player_id" value={selectedId} />

          {/* Selected preview */}
          {selected && (
            <p className="text-[#FDDD58] text-xs font-display uppercase tracking-widest">
              Selected: {selected.first_name} {selected.last_name}
            </p>
          )}

          {/* Message */}
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-widest mb-2">
              Message (optional)
            </label>
            <textarea
              name="message"
              rows={2}
              placeholder="A short blurb from Ambra & Tika…"
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#FDDD58]/50 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && (
            <p className="text-green-400 text-sm">Featured athlete updated successfully!</p>
          )}

          <button
            type="submit"
            disabled={isPending || !selectedId}
            className="bg-[#FDDD58] text-black font-display uppercase tracking-widest px-6 py-3 text-sm hover:bg-[#FDDD58]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving…" : "Set as Featured Athlete"}
          </button>
        </form>
      </section>
    </div>
  );
}

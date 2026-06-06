"use client";

import { useState, useTransition } from "react";
import { publishTop10 } from "./actions";

type Candidate = {
  id: string;
  video_url: string;
  description: string | null;
  play_type: string | null;
  players: { first_name: string; last_name: string } | null;
};

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function PublishTop10Form({ candidates }: { candidates: Candidate[] }) {
  const [open, setOpen] = useState(false);
  const [ranked, setRanked] = useState<string[]>([]);
  const [week, setWeek] = useState(getISOWeek(new Date()));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (candidates.length === 0) return null;

  function toggleRanked(id: string) {
    setRanked((prev) =>
      prev.includes(id)
        ? prev.filter((r) => r !== id)
        : prev.length < 10
        ? [...prev, id]
        : prev
    );
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setRanked((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    setRanked((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    ranked.forEach((id, i) => fd.set(`rank_${i + 1}`, id));
    startTransition(async () => {
      try {
        await publishTop10(fd);
        setSuccess(true);
        setOpen(false);
        setRanked([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to publish");
      }
    });
  }

  const candidateMap = Object.fromEntries(candidates.map((c) => [c.id, c]));

  return (
    <div className="mt-8">
      {success && (
        <div className="bg-green-900/30 border border-green-500/30 text-green-400 text-sm p-4 mb-4">
          ✓ Top 10 published for {week}!
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="bg-[#FDDD58] text-black font-display uppercase tracking-widest px-6 py-3 text-sm hover:bg-[#FDDD58]/80 transition-colors"
      >
        {open ? "Close" : "▶ Publish Top 10 This Week"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-6 bg-[#0a0a0a] border border-white/10 p-6 space-y-6">
          {/* Week selector */}
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-widest mb-2">Week</label>
            <input
              type="text"
              name="week"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              placeholder="2026-W23"
              className="bg-white/5 border border-white/10 text-white px-4 py-2 text-sm focus:outline-none focus:border-[#FDDD58]/50 w-48"
            />
            <p className="text-white/20 text-xs mt-1">ISO week format, e.g. 2026-W23</p>
          </div>

          {/* Candidate picker */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-3">
              Select up to 10 highlights ({ranked.length}/10 selected)
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {candidates.map((c) => {
                const isSelected = ranked.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                      isSelected
                        ? "border-[#FDDD58]/50 bg-[#FDDD58]/5"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRanked(c.id)}
                      className="mt-0.5 accent-[#FDDD58]"
                    />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {c.players
                          ? `${c.players.first_name} ${c.players.last_name}`
                          : "Anonymous"}{" "}
                        {c.play_type && (
                          <span className="text-white/40 text-xs">· {c.play_type}</span>
                        )}
                      </p>
                      {c.description && (
                        <p className="text-white/40 text-xs truncate">{c.description}</p>
                      )}
                      <a
                        href={c.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FDDD58]/60 text-xs hover:underline truncate block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.video_url}
                      </a>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Ranking order */}
          {ranked.length > 0 && (
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-3">
                Drag to rank (top = #1)
              </p>
              <div className="space-y-1">
                {ranked.map((id, idx) => {
                  const c = candidateMap[id];
                  if (!c) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5"
                    >
                      <span className="font-display text-[#FDDD58] text-sm w-6">#{idx + 1}</span>
                      <span className="text-white text-sm flex-1 truncate">
                        {c.players
                          ? `${c.players.first_name} ${c.players.last_name}`
                          : "Anonymous"}
                        {c.play_type && (
                          <span className="text-white/40 text-xs ml-2">· {c.play_type}</span>
                        )}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          className="text-white/30 hover:text-white px-1.5 disabled:opacity-20"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(idx)}
                          disabled={idx === ranked.length - 1}
                          className="text-white/30 hover:text-white px-1.5 disabled:opacity-20"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleRanked(id)}
                          className="text-white/20 hover:text-red-400 px-1.5"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isPending || ranked.length === 0}
            className="bg-[#FDDD58] text-black font-display uppercase tracking-widest px-6 py-3 text-sm hover:bg-[#FDDD58]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Publishing…" : `Publish Top ${ranked.length} →`}
          </button>
        </form>
      )}
    </div>
  );
}

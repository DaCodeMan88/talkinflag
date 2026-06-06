"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type Player = {
  id: string; first_name: string; last_name: string; position?: string | null;
  level?: string | null; school_or_team?: string | null; city?: string | null;
  state?: string | null; country?: string | null; country_code?: string | null;
  grad_year?: number | null; photo_url?: string | null; height_in?: number | null;
  weight_lbs?: number | null; stats?: Record<string, unknown> | null;
  recruiting_targets?: string[] | null; is_verified?: boolean; is_claimed?: boolean;
  created_at?: string;
};

type Props = {
  players: Player[];
  isCoach: boolean;
  coachId: string | null;
  initialInterests: string[];
  initialNotes: Record<string, string>;
  newPlayerIds: string[];
};

const POSITIONS = ["All", "QB", "WR", "DB", "Rusher"];

function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}'${remaining}"`;
}

export default function RecruitBrowser({
  players,
  isCoach,
  initialInterests,
  initialNotes,
  newPlayerIds,
}: Props) {
  const [posFilter, setPosFilter] = useState("All");
  const [interests, setInterests] = useState<Set<string>>(new Set(initialInterests));
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [loadingInterest, setLoadingInterest] = useState<string | null>(null);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const filtered = posFilter === "All"
    ? players
    : players.filter((p) => p.position === posFilter);

  async function toggleInterest(playerId: string) {
    if (loadingInterest) return;
    setLoadingInterest(playerId);
    const has = interests.has(playerId);
    try {
      await fetch(`/api/players/${playerId}/interest`, {
        method: has ? "DELETE" : "POST",
      });
      setInterests((prev) => {
        const next = new Set(prev);
        has ? next.delete(playerId) : next.add(playerId);
        return next;
      });
    } catch {
      // revert optimistic update on error — no-op since we didn't update yet
    } finally {
      setLoadingInterest(null);
    }
  }

  function handleNoteChange(playerId: string, value: string) {
    setNotes((prev) => ({ ...prev, [playerId]: value }));
    clearTimeout(debounceTimers.current[playerId]);
    debounceTimers.current[playerId] = setTimeout(() => {
      fetch(`/api/coaches/notes/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: value }),
      });
    }, 800);
  }

  return (
    <div>
      {/* Position filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setPosFilter(pos)}
            className={`font-display text-xs uppercase tracking-widest px-4 py-1.5 border transition-colors ${
              posFilter === pos
                ? "bg-brand-yellow text-brand-black border-brand-yellow"
                : "border-brand-white/20 text-brand-white/50 hover:border-brand-yellow/50 hover:text-brand-yellow"
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-brand-white/40 text-sm py-8 text-center">No players match this filter.</p>
      )}

      {/* Player grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((player) => {
          const isNew = newPlayerIds.includes(player.id);
          const hasInterest = interests.has(player.id);
          const initials = `${player.first_name[0] ?? ""}${player.last_name[0] ?? ""}`.toUpperCase();
          const noteOpen = openNoteId === player.id;

          const meta: string[] = [];
          if (player.position) meta.push(player.position);
          if (player.school_or_team) meta.push(player.school_or_team);
          if (player.grad_year) meta.push(`'${String(player.grad_year).slice(-2)}`);

          const physical: string[] = [];
          if (player.height_in) physical.push(formatHeight(player.height_in));
          if (player.weight_lbs) physical.push(`${player.weight_lbs} lbs`);

          return (
            <div
              key={player.id}
              className="border border-brand-white/10 bg-brand-black p-4 flex flex-col gap-3 hover:border-brand-yellow/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="shrink-0">
                  {player.photo_url ? (
                    <Image
                      src={player.photo_url}
                      alt={`${player.first_name} ${player.last_name}`}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-12 h-12"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center text-brand-yellow font-display text-sm">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-base text-brand-white">
                      {player.first_name} {player.last_name}
                    </span>
                    {isNew && (
                      <span className="text-brand-yellow text-[10px] font-display uppercase tracking-widest">
                        NEW
                      </span>
                    )}
                    {player.is_verified && (
                      <span className="text-brand-yellow text-[10px] font-display uppercase tracking-widest">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  {meta.length > 0 && (
                    <p className="text-brand-white/50 text-xs mt-0.5 truncate">{meta.join(" · ")}</p>
                  )}
                  <div className="flex gap-3 mt-1 text-xs text-brand-white/40">
                    {player.state && <span>{player.state}</span>}
                    {physical.length > 0 && <span>{physical.join(" / ")}</span>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/players/${player.id}`}
                  className="text-xs font-display uppercase tracking-widest text-brand-white/60 hover:text-brand-yellow transition-colors"
                >
                  View Profile →
                </Link>

                {isCoach && (
                  <>
                    <button
                      onClick={() => toggleInterest(player.id)}
                      disabled={loadingInterest === player.id}
                      className={`ml-auto text-xs font-display uppercase tracking-widest px-3 py-1 border transition-colors ${
                        hasInterest
                          ? "bg-brand-yellow text-brand-black border-brand-yellow"
                          : "border-brand-yellow/40 text-brand-yellow hover:bg-brand-yellow hover:text-brand-black"
                      } disabled:opacity-50`}
                    >
                      {hasInterest ? "Interested ✓" : "Express Interest"}
                    </button>

                    <button
                      onClick={() => setOpenNoteId(noteOpen ? null : player.id)}
                      className="text-xs font-display uppercase tracking-widest text-brand-white/40 hover:text-brand-white/70 transition-colors px-2 py-1 border border-brand-white/10"
                    >
                      Notes
                    </button>
                  </>
                )}
              </div>

              {isCoach && noteOpen && (
                <textarea
                  className="w-full bg-brand-white/5 border border-brand-white/10 text-brand-white/80 text-xs p-2 resize-none focus:outline-none focus:border-brand-yellow/40 placeholder:text-brand-white/20"
                  rows={3}
                  placeholder="Private notes about this player…"
                  defaultValue={notes[player.id] ?? ""}
                  onChange={(e) => handleNoteChange(player.id, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

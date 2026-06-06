"use client";

import { useState, useTransition, useRef } from "react";
import { addEventResult, deleteEventResult } from "./actions";

type Result = {
  id: string;
  place: number | null;
  team_name: string;
  division: string | null;
  score: string | null;
  notes: string | null;
};

const PLACE_LABELS: Record<number, string> = {
  1: "🥇 1st",
  2: "🥈 2nd",
  3: "🥉 3rd",
};

export function ResultsForm({ eventId, existing }: { eventId: string; existing: Result[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await addEventResult(eventId, fd);
        setSuccess(true);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add result");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteEventResult(id, eventId);
    });
  }

  // Group by division
  const divisions = Array.from(new Set(existing.map((r) => r.division ?? "General"))).sort();

  return (
    <div className="space-y-10">
      {/* Existing results */}
      {existing.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-display text-sm uppercase tracking-widest text-white/40">
            Results ({existing.length} entries)
          </h2>
          {divisions.map((div) => {
            const rows = existing
              .filter((r) => (r.division ?? "General") === div)
              .sort((a, b) => (a.place ?? 99) - (b.place ?? 99));
            return (
              <div key={div}>
                <p className="text-[#FDDD58] font-display text-xs uppercase tracking-widest mb-3">
                  {div}
                </p>
                <div className="space-y-2">
                  {rows.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-4 bg-[#0d0d0d] border border-white/10 px-4 py-3"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="font-display text-sm text-[#FDDD58] w-10 shrink-0">
                          {r.place ? (PLACE_LABELS[r.place] ?? `#${r.place}`) : "—"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm truncate">{r.team_name}</p>
                          <p className="text-white/30 text-xs">
                            {[r.score, r.notes].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={isPending}
                        className="text-white/20 hover:text-red-400 transition-colors text-xs font-display uppercase tracking-widest shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Add result form */}
      <section>
        <h2 className="font-display text-sm uppercase tracking-widest text-white/40 mb-5">
          Add Result
        </h2>
        <form ref={formRef} onSubmit={handleAdd} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/40 text-xs uppercase tracking-widest mb-1.5">
                Team Name <span className="text-[#FDDD58]">*</span>
              </label>
              <input
                type="text"
                name="team_name"
                required
                placeholder="USA Men's Open"
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#FDDD58]/50"
              />
            </div>
            <div>
              <label className="block text-white/40 text-xs uppercase tracking-widest mb-1.5">
                Place
              </label>
              <input
                type="number"
                name="place"
                min={1}
                placeholder="1"
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#FDDD58]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/40 text-xs uppercase tracking-widest mb-1.5">
                Division
              </label>
              <input
                type="text"
                name="division"
                placeholder="Men's Open"
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#FDDD58]/50"
              />
            </div>
            <div>
              <label className="block text-white/40 text-xs uppercase tracking-widest mb-1.5">
                Score
              </label>
              <input
                type="text"
                name="score"
                placeholder="53-21"
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#FDDD58]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/40 text-xs uppercase tracking-widest mb-1.5">
              Notes
            </label>
            <input
              type="text"
              name="notes"
              placeholder="Optional note"
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#FDDD58]/50"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">✓ Result added.</p>}

          <button
            type="submit"
            disabled={isPending}
            className="bg-[#FDDD58] text-black font-display uppercase tracking-widest px-6 py-2.5 text-sm hover:bg-[#FDDD58]/80 transition-colors disabled:opacity-40"
          >
            {isPending ? "Saving…" : "Add Result →"}
          </button>
        </form>
      </section>
    </div>
  );
}

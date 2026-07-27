"use client";

import { useState, useTransition } from "react";
import { DENIAL_PRESETS } from "@/lib/review/denial-presets";
import { approvePlayer, denyPlayer, deletePlayer } from "./actions";

export default function PendingReviewActions({
  playerId,
  mode = "pending",
}: {
  playerId: string;
  mode?: "pending" | "denied";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [presetKey, setPresetKey] = useState("");
  const [note, setNote] = useState("");

  function approve() {
    setError(null);
    startTransition(async () => {
      try {
        await approvePlayer(playerId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to approve.");
      }
    });
  }

  if (mode === "denied") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={approve}
          className="bg-[#FDDD58] text-black font-display uppercase tracking-widest text-xs py-2 px-4 hover:bg-[#FDDD58]/90 transition-colors disabled:opacity-50"
        >
          Approve
        </button>
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>
    );
  }

  function sendDenial() {
    if (!presetKey) return;
    setError(null);
    startTransition(async () => {
      try {
        await denyPlayer(playerId, presetKey, note.trim() || undefined);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to deny.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={approve}
          className="bg-[#FDDD58] text-black font-display uppercase tracking-widest text-xs py-2 px-4 hover:bg-[#FDDD58]/90 transition-colors disabled:opacity-50"
        >
          Approve
        </button>
        <select
          value={presetKey}
          onChange={(e) => setPresetKey(e.target.value)}
          disabled={pending}
          aria-label="Deny reason"
          className="bg-[#111] border border-white/10 text-white text-xs px-2 py-2 focus:outline-none focus:border-[#FDDD58]/50 transition-colors disabled:opacity-50 max-w-[180px]"
        >
          <option value="">Deny reason…</option>
          {Object.entries(DENIAL_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={pending}
          placeholder="Note (optional)"
          aria-label="Denial note"
          className="bg-[#111] border border-white/10 text-white placeholder-white/25 text-xs px-2 py-2 focus:outline-none focus:border-[#FDDD58]/50 transition-colors disabled:opacity-50 w-32"
        />
        <button
          type="button"
          disabled={pending || !presetKey}
          onClick={sendDenial}
          className="border border-white/20 text-white/70 font-display uppercase tracking-widest text-xs py-2 px-4 hover:border-[#FDDD58]/50 hover:text-white transition-colors disabled:opacity-40"
        >
          Send denial
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              !window.confirm(
                "Delete this registration permanently? Use Deny instead if the athlete just needs to fix something."
              )
            )
              return;
            startTransition(() => deletePlayer(playerId));
          }}
          className="text-white/20 hover:text-red-400 text-xs transition-colors disabled:opacity-50"
        >
          Delete (spam)
        </button>
      </div>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}

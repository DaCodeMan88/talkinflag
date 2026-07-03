"use client";

import { useTransition } from "react";
import { approvePlayer, deletePlayer } from "./actions";

export default function PendingReviewActions({ playerId }: { playerId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={pending}
        onClick={() => startTransition(() => approvePlayer(playerId))}
        className="bg-[#FDDD58] text-black font-display uppercase tracking-widest text-xs py-2 px-4 hover:bg-[#FDDD58]/90 transition-colors disabled:opacity-50"
      >
        Approve
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Reject and delete this registration? This can't be undone.")) return;
          startTransition(() => deletePlayer(playerId));
        }}
        className="border border-red-500/40 text-red-400 font-display uppercase tracking-widest text-xs py-2 px-4 hover:border-red-500/70 transition-colors disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}

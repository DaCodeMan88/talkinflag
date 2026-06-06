"use client";

import { useTransition, useState } from "react";
import { reviewHighlight } from "./actions";

export function HighlightActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState(status);

  function update(newStatus: "approved" | "rejected" | "top10") {
    startTransition(async () => {
      await reviewHighlight(id, newStatus);
      setCurrent(newStatus);
    });
  }

  if (current === "top10") {
    return (
      <span className="text-[#FDDD58] font-display text-xs uppercase tracking-widest">
        ★ Top 10
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => update("top10")}
        disabled={isPending}
        className="bg-[#FDDD58] text-black font-display text-xs uppercase tracking-widest px-3 py-1.5 hover:bg-[#FDDD58]/80 transition-colors disabled:opacity-40"
      >
        ★ Top 10
      </button>
      {current !== "approved" && (
        <button
          onClick={() => update("approved")}
          disabled={isPending}
          className="border border-green-500/40 text-green-400 font-display text-xs uppercase tracking-widest px-3 py-1.5 hover:bg-green-500/10 transition-colors disabled:opacity-40"
        >
          Approve
        </button>
      )}
      {current !== "rejected" && (
        <button
          onClick={() => update("rejected")}
          disabled={isPending}
          className="border border-red-500/30 text-red-400 font-display text-xs uppercase tracking-widest px-3 py-1.5 hover:bg-red-500/10 transition-colors disabled:opacity-40"
        >
          Reject
        </button>
      )}
      {current === "approved" && (
        <span className="text-green-400 font-display text-xs uppercase tracking-widest">✓ Approved</span>
      )}
      {current === "rejected" && (
        <span className="text-red-400 font-display text-xs uppercase tracking-widest">✗ Rejected</span>
      )}
    </div>
  );
}

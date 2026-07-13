"use client";

import { useTransition } from "react";
import { approveClaim } from "../players/actions";

export default function ApproveClaimButton({ playerId }: { playerId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => approveClaim(playerId))}
      className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-[11px] px-4 py-1.5 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
    >
      Approve
    </button>
  );
}

"use client";

import { useTransition } from "react";
import { toggleClaim } from "../players/actions";

export default function ReleaseClaimButton({ playerId }: { playerId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Release this claim? The player will show as unclaimed again.")) return;
        startTransition(() => toggleClaim(playerId, false));
      }}
      className="text-red-400 text-[11px] font-display uppercase tracking-widest hover:text-red-300 transition-colors disabled:opacity-50"
    >
      Release
    </button>
  );
}

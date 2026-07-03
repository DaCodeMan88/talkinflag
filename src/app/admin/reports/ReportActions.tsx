"use client";

import { useTransition } from "react";
import { releaseFromReport, dismissReport } from "./actions";

export default function ReportActions({ reportId, playerId }: { reportId: string; playerId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Release this profile's claim and mark the report resolved?")) return;
          startTransition(() => releaseFromReport(reportId, playerId));
        }}
        className="border border-red-500/40 text-red-400 font-display uppercase tracking-widest text-xs py-2 px-4 hover:border-red-500/70 transition-colors disabled:opacity-50"
      >
        Release Claim
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => dismissReport(reportId))}
        className="text-white/40 text-xs font-display uppercase tracking-widest hover:text-white/70 transition-colors disabled:opacity-50"
      >
        Dismiss
      </button>
    </div>
  );
}

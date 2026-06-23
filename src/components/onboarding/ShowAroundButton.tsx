"use client";

import { startTour } from "./GuidedTour";

export default function ShowAroundButton({
  tourId,
  label = "Show me around",
  className,
}: {
  tourId: string;
  label?: string;
  className?: string;
}) {
  return (
    <button
      onClick={() => startTour(tourId)}
      className={
        className ??
        "text-brand-white/40 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
      }
    >
      {label}
    </button>
  );
}

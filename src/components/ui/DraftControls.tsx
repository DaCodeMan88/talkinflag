"use client";

import type { SaveStatus } from "@/hooks/useAutosaveDraft";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "earlier";
  const s = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

/** "Resume where you left off?" banner shown when a newer draft exists. */
export function ResumeBanner({
  updatedAt,
  source,
  onResume,
  onDismiss,
  label = "your progress",
}: {
  updatedAt: string;
  source: "local" | "server";
  onResume: () => void;
  onDismiss: () => void;
  label?: string;
}) {
  return (
    <div
      role="region"
      aria-label="Resume saved progress"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-3 animate-[fadeIn_240ms_ease]"
    >
      <div className="min-w-0">
        <p className="font-display uppercase tracking-widest text-brand-yellow text-xs">Resume where you left off?</p>
        <p className="text-brand-white/60 text-xs mt-0.5">
          We saved {label} {timeAgo(updatedAt)}
          {source === "server" ? " (synced across your devices)" : ""}.
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={onResume}
          className="rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-[11px] px-4 py-2"
        >
          Resume
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-white/20 text-brand-white/70 font-display uppercase tracking-widest text-[11px] px-4 py-2"
        >
          Start fresh
        </button>
      </div>
    </div>
  );
}

/** Subtle autosave status indicator ("Saving…" / "Saved ✓"). */
export function SaveIndicator({ status, className = "" }: { status: SaveStatus; className?: string }) {
  if (status === "idle") return null;
  const map: Record<Exclude<SaveStatus, "idle">, { text: string; cls: string }> = {
    saving: { text: "Saving…", cls: "text-brand-white/40" },
    saved: { text: "Saved ✓", cls: "text-brand-yellow" },
    error: { text: "Couldn’t save — we’ll retry", cls: "text-red-400" },
  };
  const cfg = map[status];
  return (
    <span
      aria-live="polite"
      className={`text-[11px] font-display uppercase tracking-widest transition-opacity ${cfg.cls} ${className}`}
    >
      {cfg.text}
    </span>
  );
}

"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export type TourStep = {
  /** CSS selector for the element to spotlight. Omit for a centered, no-target step. */
  target?: string;
  title: string;
  body: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;

function storageKey(tourId: string) {
  return `tf_tour_${tourId}_done`;
}

export function hasCompletedTour(tourId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey(tourId)) === "1";
  } catch {
    return false;
  }
}

export default function GuidedTour({
  tourId,
  steps,
  autoStart = false,
}: {
  tourId: string;
  steps: TourStep[];
  autoStart?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Auto-start once per browser unless already completed.
  useEffect(() => {
    if (autoStart && !hasCompletedTour(tourId)) {
      setIndex(0);
      setOpen(true);
    }
  }, [autoStart, tourId]);

  // Allow other UI (e.g. a "Show me around" button) to launch the tour.
  useEffect(() => {
    const launch = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail === tourId) {
        setIndex(0);
        setOpen(true);
      }
    };
    window.addEventListener("tf:start-tour", launch as EventListener);
    return () => window.removeEventListener("tf:start-tour", launch as EventListener);
  }, [tourId]);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // On each step, scroll the target into view, then measure.
  useLayoutEffect(() => {
    if (!open) return;
    if (step?.target) {
      const el = document.querySelector(step.target) as HTMLElement | null;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const id = window.setTimeout(measure, 320);
    return () => window.clearTimeout(id);
  }, [open, index, step, measure]);

  useEffect(() => {
    if (!open) return;
    const onChange = () => measure();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [open, measure]);

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey(tourId), "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, [tourId]);

  // Keyboard: Esc to skip, arrows to navigate.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, steps.length - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish, steps.length]);

  if (!open || !step) return null;

  const isLast = index === steps.length - 1;

  // Tooltip placement: below the target if there's room, else above; centered if no target.
  let cardStyle: React.CSSProperties;
  if (rect) {
    const spaceBelow = window.innerHeight - (rect.top + rect.height);
    const placeBelow = spaceBelow > 220;
    const top = placeBelow ? rect.top + rect.height + PAD + 8 : Math.max(16, rect.top - PAD - 8 - 200);
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - 360);
    cardStyle = { top, left };
  } else {
    cardStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Site tour">
      {/* Dim layer + spotlight cutout (box-shadow trick) */}
      {rect ? (
        <div
          className="absolute pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 6,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.78)",
            outline: "2px solid #FDDD58",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/78" />
      )}

      {/* Click-catcher to skip when clicking the dimmed area */}
      <button
        aria-label="Skip tour"
        onClick={finish}
        className="absolute inset-0 w-full h-full cursor-default"
        tabIndex={-1}
      />

      {/* Tooltip card */}
      <div
        className="absolute w-[340px] max-w-[calc(100vw-32px)] bg-[#0d0d0d] border border-[#FDDD58]/40 shadow-2xl p-5"
        style={cardStyle}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#FDDD58] font-display uppercase tracking-widest text-[11px]">
            Step {index + 1} of {steps.length}
          </span>
          <button
            onClick={finish}
            className="text-white/30 hover:text-white text-[11px] font-display uppercase tracking-widest"
          >
            Skip
          </button>
        </div>
        <h3 className="font-display uppercase text-white text-lg leading-tight tracking-wide">
          {step.title}
        </h3>
        <p className="text-white/60 text-sm leading-relaxed mt-2">{step.body}</p>

        <div className="flex items-center justify-between mt-5">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-[#FDDD58]" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            {index > 0 && (
              <button
                onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                className="text-white/50 text-xs font-display uppercase tracking-widest hover:text-white"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
              className="bg-[#FDDD58] text-black font-display uppercase tracking-widest text-xs py-2 px-4 hover:bg-[#FDDD58]/90 transition-colors"
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Imperatively start a tour from anywhere (e.g. a "Show me around" button). */
export function startTour(tourId?: string) {
  window.dispatchEvent(new CustomEvent("tf:start-tour", { detail: tourId }));
}

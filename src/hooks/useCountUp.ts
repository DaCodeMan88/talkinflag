"use client";
import { useEffect, useRef, useState } from "react";

export interface CountTarget {
  value: number;
  prefix: string;
  suffix: string;
}

/** "75+" -> {value:75,prefix:"",suffix:"+"}; "#1" -> {value:1,prefix:"#",suffix:""}; "TBD" -> null. */
export function parseCountTarget(raw: string): CountTarget | null {
  const match = raw.match(/^([^\d]*)(\d+)([^\d]*)$/);
  if (!match) return null;
  return { value: Number(match[2]), prefix: match[1], suffix: match[3] };
}

export function formatCount(current: number, target: CountTarget): string {
  return `${target.prefix}${current}${target.suffix}`;
}

/**
 * Animates from 0 to the numeric value embedded in `raw` (e.g. "75+", "#1")
 * once `start` becomes true, and freezes at the literal string for anything
 * non-numeric ("TBD"). Duration in ms.
 * Note: `raw` is treated as immutable for the life of this hook; changing it
 * after mount does not restart or update the animation.
 */
export function useCountUp(raw: string, start: boolean, duration = 1200): string {
  const target = useRef(parseCountTarget(raw)).current;
  const [display, setDisplay] = useState(target ? formatCount(0, target) : raw);
  const started = useRef(false);

  useEffect(() => {
    if (!start || !target || started.current) return;
    started.current = true;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setDisplay(formatCount(target.value, target));
      return;
    }

    const startTime = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(formatCount(Math.round(eased * target.value), target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);

  return display;
}

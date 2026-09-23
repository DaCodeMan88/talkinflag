"use client";
import { useRef, useState, useEffect } from "react";
import { useCountUp } from "@/hooks/useCountUp";

/** A StatsBar number that counts up once, the first time it scrolls into view. */
export function StatNumber({ value }: { value: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const display = useCountUp(value, inView);
  return (
    <p ref={ref} className="font-display text-4xl md:text-5xl text-brand-black tabular-nums">
      {/* Screen readers get the final value, not every intermediate frame. */}
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{value}</span>
    </p>
  );
}

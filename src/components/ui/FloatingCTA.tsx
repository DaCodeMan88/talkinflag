"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Link
      href="/join"
      aria-label="Join Talkin Flag"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      // Show/hide lives in classes, not an inline style: an inline
      // `transform` would override hover:scale-105 / active:scale-95.
      className={cn(
        "fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3.5 shadow-lg shadow-black/40 transition-all duration-300 hover:scale-105 hover:bg-yellow-400 active:scale-95",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <Play size={16} fill="currentColor" />
      Join Free
    </Link>
  );
}

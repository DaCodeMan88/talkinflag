"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";

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
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3.5 shadow-lg shadow-black/40 transition-all duration-300 hover:scale-105 hover:bg-yellow-400 active:scale-95"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <Play size={16} fill="currentColor" />
      Join Free
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";

export function DaysUntil({ dateStr }: { dateStr: string }) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(dateStr + "T12:00:00Z");
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    setDays(diff);
  }, [dateStr]);

  if (days === null) return null;
  if (days < 0) return null;
  if (days === 0) return <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">Today</span>;
  if (days === 1) return <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">Tomorrow</span>;
  if (days <= 30) return <span className="text-brand-yellow font-display text-xs uppercase tracking-widest">{days} days away</span>;
  if (days <= 365) {
    const weeks = Math.round(days / 7);
    return <span className="text-brand-white/40 font-display text-xs uppercase tracking-widest">{weeks}w away</span>;
  }
  const months = Math.round(days / 30);
  return <span className="text-brand-white/30 font-display text-xs uppercase tracking-widest">{months}mo away</span>;
}

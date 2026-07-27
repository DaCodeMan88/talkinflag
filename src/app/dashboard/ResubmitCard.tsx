"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResubmitCard({
  playerId,
  fix,
  note,
}: {
  playerId: string;
  fix: string | null;
  note: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/players/${playerId}/resubmit`, {
        method: "POST",
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0d0d0d] border border-brand-white/10 border-l-4 border-l-[#FDDD58] p-6 mb-8 space-y-3">
      <h2 className="font-display text-xl uppercase text-brand-white">
        One step before you&apos;re live
      </h2>
      <p className="text-brand-white/70 text-sm leading-relaxed">
        {fix ?? "Update your details and resubmit."}
      </p>
      {note && (
        <p className="text-brand-white/50 text-sm leading-relaxed">
          A note from our team: {note}
        </p>
      )}

      {done ? (
        <p className="text-brand-yellow text-sm font-display uppercase tracking-widest">
          Resubmitted ✓ — we&apos;ll review it shortly.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <Link
            href="/dashboard/edit"
            className="bg-[#FDDD58] text-black font-display uppercase tracking-widest text-xs py-2 px-4 hover:opacity-90 transition-opacity"
          >
            Update profile
          </Link>
          <button
            type="button"
            onClick={handleResubmit}
            disabled={loading}
            className="border border-brand-white/20 text-brand-white/70 font-display uppercase tracking-widest text-xs py-2 px-4 hover:text-brand-white hover:border-brand-white/40 transition-colors disabled:opacity-50"
          >
            {loading ? "Resubmitting…" : "Resubmit for review"}
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}

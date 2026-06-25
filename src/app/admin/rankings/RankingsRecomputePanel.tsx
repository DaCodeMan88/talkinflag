"use client";
import { useState } from "react";
import Link from "next/link";

interface Props {
  totalPlayers: number;
  rankedPlayers: number;
  lastRun: string | null;
  stale?: boolean;
}

export default function RankingsRecomputePanel({ totalPlayers, rankedPlayers, lastRun, stale }: Props) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<{ rankedCount?: number; error?: string } | null>(null);

  async function handleRecompute() {
    setStatus("running");
    setResult(null);
    try {
      const res = await fetch("/api/admin/recompute-rankings", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setResult({ error: json.error ?? "Unknown error" });
      } else {
        setStatus("done");
        setResult({ rankedCount: json.rankedCount });
      }
    } catch (e) {
      setStatus("error");
      setResult({ error: String(e) });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link href="/admin" className="text-white/30 font-display text-xs uppercase tracking-widest hover:text-white/60 mb-8 inline-block">
        ← Admin
      </Link>

      <div className="border-l-4 border-[#FDDD58] pl-6 mb-10">
        <h1 className="font-display text-4xl uppercase text-white leading-none">TF Rank</h1>
        <p className="text-white/40 mt-2 text-sm">
          Recompute player rankings from community poll weights + verified stats.
        </p>
      </div>

      {stale && status !== "done" && (
        <div className="border border-[#FDDD58]/40 bg-[#FDDD58]/5 p-4 mb-8 flex items-center gap-3">
          <span className="text-[#FDDD58] text-lg">⟳</span>
          <p className="text-white/70 text-sm">
            Ranking-relevant career updates have been approved since the last recompute.{" "}
            <span className="text-[#FDDD58]">Recompute recommended.</span>
          </p>
        </div>
      )}

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Total Players", value: totalPlayers },
          { label: "Currently Ranked", value: rankedPlayers },
          { label: "Last Run", value: lastRun ? new Date(lastRun).toLocaleDateString() : "Never" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0d0d0d] border border-white/10 p-4 text-center">
            <p className="font-display text-xl text-[#FDDD58]">{stat.value}</p>
            <p className="text-white/30 text-xs mt-1 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0d0d0d] border border-white/10 p-6 mb-8">
        <h2 className="font-display text-sm uppercase tracking-widest text-[#FDDD58] mb-3">
          Pipeline
        </h2>
        <ol className="space-y-2 text-white/60 text-sm list-decimal list-inside">
          <li>Rebuild league-adjusted player vectors</li>
          <li>Aggregate Evaluation poll responses → dimension weights per role</li>
          <li>TF Score = Coaches (55%) + Experts (30%) + Hosts (15%) × dimension scores × verification factor</li>
          <li>Write <code className="text-[#FDDD58]">ranking_national</code> + <code className="text-[#FDDD58]">ranking_position</code> to every player row</li>
          <li>Snapshot top 100 to <code className="text-[#FDDD58]">ranking_snapshots</code></li>
        </ol>
        <p className="text-white/25 text-xs mt-4">
          Runs automatically once a week, Sundays at 02:00 UTC, when the cron is configured.
        </p>
      </div>

      <button
        onClick={handleRecompute}
        disabled={status === "running"}
        className="font-display uppercase tracking-widest text-sm px-8 py-4 bg-[#FDDD58] text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "running" ? "Computing…" : "Recompute Rankings Now"}
      </button>

      {status === "done" && result && (
        <div className="mt-6 border border-green-500/30 bg-green-500/5 p-4">
          <p className="font-display text-sm uppercase tracking-widest text-green-400">
            ✓ Complete — {result.rankedCount} players ranked
          </p>
          <p className="text-white/40 text-xs mt-1">
            Snapshot saved.{" "}
            <Link href="/rankings" className="text-[#FDDD58] hover:underline">
              View Rankings →
            </Link>
          </p>
        </div>
      )}

      {status === "error" && result && (
        <div className="mt-6 border border-red-500/30 bg-red-500/5 p-4">
          <p className="font-display text-sm uppercase tracking-widest text-red-400">Error</p>
          <p className="text-white/60 text-xs mt-1 font-mono">{result.error}</p>
        </div>
      )}
    </div>
  );
}

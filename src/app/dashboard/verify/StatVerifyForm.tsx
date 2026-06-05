"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StatItem {
  key: string;
  label: string;
  value: string;
  submission: { status: string; source_type: string } | null;
}

interface Coach {
  id: string;
  name: string;
  team: string;
  level: string;
}

const SOURCE_TYPES = [
  { value: "maxpreps", label: "MaxPreps", placeholder: "https://www.maxpreps.com/athlete/..." },
  { value: "hudl", label: "Hudl", placeholder: "https://www.hudl.com/profile/..." },
  { value: "nfhs", label: "NFHS", placeholder: "https://www.nfhs.com/..." },
  { value: "ifaf", label: "IFAF", placeholder: "https://www.ifaf.org/..." },
  { value: "coach", label: "Coach Sign-off", placeholder: "" },
  { value: "other", label: "Other Source", placeholder: "https://..." },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pending Review", cls: "text-brand-white/40 border-brand-white/15" },
  approved: { label: "✓ Verified",      cls: "text-brand-yellow border-brand-yellow/40" },
  rejected: { label: "Not Approved",    cls: "text-red-400 border-red-500/30" },
};

export default function StatVerifyForm({
  playerId,
  stats,
  coaches,
}: {
  playerId: string;
  stats: StatItem[];
  coaches: Coach[];
}) {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState("maxpreps");
  const [sourceUrl, setSourceUrl] = useState("");
  const [coachId, setCoachId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const selectedStat = stats.find((s) => s.key === selectedKey);
  const placeholder = SOURCE_TYPES.find((s) => s.value === sourceType)?.placeholder ?? "";

  function openForm(key: string) {
    setSelectedKey(key);
    setSourceType("maxpreps");
    setSourceUrl("");
    setCoachId("");
    setError(null);
    setSubmitted(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedKey) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/players/${playerId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stat_key: selectedKey,
        source_type: sourceType,
        source_url: sourceType !== "coach" ? sourceUrl : null,
        coach_id: sourceType === "coach" ? coachId : null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
    } else {
      setSubmitted(selectedKey);
      setSelectedKey(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      {submitted && (
        <div className="bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-sm px-4 py-3 font-display uppercase tracking-widest">
          Submitted — we&apos;ll review and update your profile shortly.
        </div>
      )}

      {stats.map((stat) => {
        const statusCfg = stat.submission ? STATUS_CONFIG[stat.submission.status] : null;
        const isOpen = selectedKey === stat.key;
        const canSubmit = !stat.submission || stat.submission.status === "rejected";

        return (
          <div
            key={stat.key}
            className={`bg-[#0d0d0d] border transition-colors ${isOpen ? "border-brand-yellow/30" : "border-brand-white/10"}`}
          >
            {/* Stat row */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-brand-white text-sm font-semibold">{stat.label}</p>
                  <p className="text-brand-white/40 text-xs mt-0.5">{stat.value}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {statusCfg && (
                  <span className={`text-[10px] font-display uppercase tracking-widest border px-2 py-1 ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                )}
                {canSubmit && !isOpen && (
                  <button
                    onClick={() => openForm(stat.key)}
                    className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
                  >
                    {stat.submission?.status === "rejected" ? "Resubmit →" : "Submit →"}
                  </button>
                )}
                {isOpen && (
                  <button
                    onClick={() => setSelectedKey(null)}
                    className="text-brand-white/30 text-xs font-display uppercase tracking-widest hover:text-brand-white transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Inline form */}
            {isOpen && (
              <form onSubmit={handleSubmit} className="border-t border-brand-white/10 p-5 space-y-4">
                {error && (
                  <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-xs px-4 py-3">
                    {error}
                  </div>
                )}

                {/* Source type picker */}
                <div>
                  <label className="block text-xs font-display uppercase tracking-widest text-brand-white/40 mb-2">
                    Source
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_TYPES.filter((s) => s.value !== "coach" || coaches.length > 0).map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => { setSourceType(s.value); setSourceUrl(""); setCoachId(""); }}
                        className={`text-xs font-display uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                          sourceType === s.value
                            ? "bg-brand-yellow text-brand-black border-brand-yellow"
                            : "border-brand-white/15 text-brand-white/50 hover:border-brand-white/30"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* URL or coach picker */}
                {sourceType === "coach" ? (
                  <div>
                    <label className="block text-xs font-display uppercase tracking-widest text-brand-white/40 mb-2">
                      Select Coach
                    </label>
                    <select
                      value={coachId}
                      onChange={(e) => setCoachId(e.target.value)}
                      required
                      className="w-full bg-[#111111] border border-brand-white/10 text-brand-white px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
                    >
                      <option value="">Select a verified coach...</option>
                      {coaches.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.team}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-display uppercase tracking-widest text-brand-white/40 mb-2">
                      Link to your {SOURCE_TYPES.find((s) => s.value === sourceType)?.label} profile or stat page
                    </label>
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder={placeholder}
                      required
                      className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <p className="text-brand-white/20 text-xs">
                    Submitting: <span className="text-brand-white/40">{selectedStat?.label} — {selectedStat?.value}</span>
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <span className="animate-spin border-2 border-brand-black border-t-transparent rounded-full w-3 h-3" />}
                    Submit for Verification
                  </button>
                </div>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}

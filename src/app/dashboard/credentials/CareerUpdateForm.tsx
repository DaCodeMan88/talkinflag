"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface KindOption {
  kind: string;
  label: string;
  fields: string[];
}

interface MyUpdate {
  id: string;
  kind: string;
  title: string;
  status: string;
  created_at: string;
}

const FIELD_LABEL: Record<string, string> = {
  title: "Title",
  team: "Team",
  level: "Level",
  new_role: "New Role",
  date: "Date",
  description: "Details",
};

const FIELD_PLACEHOLDER: Record<string, string> = {
  title: "e.g. 2026 IFAF World Championship",
  team: "e.g. Italy National Team",
  level: "e.g. National / College / High School",
  new_role: "e.g. Head Coach",
  date: "e.g. June 2026",
  description: "A sentence or two of context.",
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending Review", cls: "text-brand-white/40 border-brand-white/15" },
  approved: { label: "✓ Live", cls: "text-brand-yellow border-brand-yellow/40" },
  rejected: { label: "Not Approved", cls: "text-red-400 border-red-500/30" },
};

export default function CareerUpdateForm({
  kinds,
  mine,
}: {
  kinds: KindOption[];
  mine: MyUpdate[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<string>(kinds[0]?.kind ?? "");
  const [detail, setDetail] = useState<Record<string, string>>({});
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const selected = kinds.find((k) => k.kind === kind);

  function selectKind(k: string) {
    setKind(k);
    setDetail({});
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/career-updates/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, detail, evidence_url: evidenceUrl || null, website_url: honeypot }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
    setDetail({});
    setEvidenceUrl("");
    router.refresh();
    setTimeout(() => setDone(false), 4000);
  }

  return (
    <div className="space-y-8">
      {done && (
        <div className="bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-sm px-4 py-3 font-display uppercase tracking-widest">
          Submitted — we&apos;ll review and update your profile shortly.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#0d0d0d] border border-brand-white/10 p-5 space-y-5">
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-xs px-4 py-3">{error}</div>
        )}

        {/* Kind picker */}
        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-brand-white/40 mb-2">
            Update Type
          </label>
          <div className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button
                key={k.kind}
                type="button"
                onClick={() => selectKind(k.kind)}
                className={`text-xs font-display uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                  kind === k.kind
                    ? "bg-brand-yellow text-brand-black border-brand-yellow"
                    : "border-brand-white/15 text-brand-white/50 hover:border-brand-white/30"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic fields */}
        {selected?.fields.map((f) => (
          <div key={f}>
            <label className="block text-xs font-display uppercase tracking-widest text-brand-white/40 mb-2">
              {FIELD_LABEL[f] ?? f}
            </label>
            {f === "description" ? (
              <textarea
                value={detail[f] ?? ""}
                onChange={(e) => setDetail((d) => ({ ...d, [f]: e.target.value }))}
                placeholder={FIELD_PLACEHOLDER[f]}
                rows={3}
                maxLength={600}
                className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
              />
            ) : (
              <input
                type="text"
                value={detail[f] ?? ""}
                onChange={(e) => setDetail((d) => ({ ...d, [f]: e.target.value }))}
                placeholder={FIELD_PLACEHOLDER[f]}
                maxLength={280}
                className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
              />
            )}
          </div>
        ))}

        {/* Evidence */}
        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-brand-white/40 mb-2">
            Evidence Link <span className="text-brand-white/20">(optional but speeds approval)</span>
          </label>
          <input
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
          />
        </div>

        {/* Honeypot (hidden from humans) */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <span className="animate-spin border-2 border-brand-black border-t-transparent rounded-full w-3 h-3" />}
            Submit Update
          </button>
        </div>
      </form>

      {/* Existing submissions */}
      {mine.length > 0 && (
        <div>
          <h2 className="font-display uppercase tracking-widest text-brand-white/40 text-xs mb-3">Your Updates</h2>
          <div className="space-y-2">
            {mine.map((m) => {
              const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.pending;
              const kindLabel = kinds.find((k) => k.kind === m.kind)?.label ?? m.kind.replace(/_/g, " ");
              return (
                <div key={m.id} className="flex items-center justify-between bg-[#0d0d0d] border border-brand-white/10 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-brand-white text-sm truncate">
                      {kindLabel}{m.title ? <span className="text-brand-white/50"> — {m.title}</span> : null}
                    </p>
                    <p className="text-brand-white/30 text-xs mt-0.5">
                      {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`text-[10px] font-display uppercase tracking-widest border px-2 py-1 shrink-0 ml-3 ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

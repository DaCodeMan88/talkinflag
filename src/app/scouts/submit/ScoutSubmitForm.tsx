"use client";

import { useState } from "react";

const STAT_OPTIONS = [
  { key: "forty_yard", label: "40-Yard Dash" },
  { key: "vertical_jump", label: "Vertical Jump" },
  { key: "height", label: "Height" },
  { key: "weight", label: "Weight" },
  { key: "broad_jump", label: "Broad Jump" },
  { key: "shuttle", label: "5-10-5 Shuttle" },
];

type Stat = { stat_key: string; stat_value: string };

type Player = { id: string; first_name: string; last_name: string; school_or_team: string | null };

export default function ScoutSubmitForm() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Player | null>(null);
  const [stats, setStats] = useState<Stat[]>([{ stat_key: "forty_yard", stat_value: "" }]);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "sending" | "done" | "error">("idle");

  async function search() {
    if (query.length < 2) return;
    setStatus("searching");
    const res = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.players ?? []);
    setStatus("idle");
  }

  function addStat() {
    setStats((s) => [...s, { stat_key: "forty_yard", stat_value: "" }]);
  }

  function removeStat(i: number) {
    setStats((s) => s.filter((_, idx) => idx !== i));
  }

  function updateStat(i: number, field: keyof Stat, value: string) {
    setStats((s) => s.map((stat, idx) => idx === i ? { ...stat, [field]: value } : stat));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus("sending");
    const res = await fetch("/api/scouts/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id: selected.id,
        stats: stats.filter((s) => s.stat_value.trim()),
        event_name: eventName,
        event_date: eventDate,
      }),
    });
    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-8 text-center space-y-3">
        <p className="font-display text-2xl uppercase text-brand-yellow">Stats Submitted</p>
        <p className="text-brand-white/60 text-sm">Stats are pending admin review and will appear on the player profile once approved.</p>
        <button
          onClick={() => { setSelected(null); setQuery(""); setStats([{ stat_key: "forty_yard", stat_value: "" }]); setStatus("idle"); }}
          className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:underline"
        >
          Submit Another →
        </button>
      </div>
    );
  }

  const inputClass = "w-full bg-[#0a0a0a] border border-brand-white/10 text-brand-white px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 placeholder:text-brand-white/20";
  const labelClass = "block text-brand-white/40 text-xs font-display uppercase tracking-widest mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Event info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Event Name</label>
          <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. All22 Flag Combine — Atlanta" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Event Date</label>
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Player search */}
      <div>
        <label className={labelClass}>Player *</label>
        {selected ? (
          <div className="flex items-center justify-between bg-brand-yellow/10 border border-brand-yellow/30 px-4 py-3">
            <span className="text-brand-white text-sm font-semibold">
              {selected.first_name} {selected.last_name}
              {selected.school_or_team && <span className="text-brand-white/40 ml-2 font-normal">· {selected.school_or_team}</span>}
            </span>
            <button type="button" onClick={() => { setSelected(null); setResults([]); }} className="text-brand-yellow text-xs font-display uppercase tracking-widest hover:underline">
              Change
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
                placeholder="Search by name…"
                className={inputClass}
              />
              <button type="button" onClick={search} className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs px-5 hover:bg-brand-yellow/90 transition-colors flex-shrink-0">
                Search
              </button>
            </div>
            {results.length > 0 && (
              <div className="border border-brand-white/10 divide-y divide-brand-white/5">
                {results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSelected(p); setResults([]); }}
                    className="w-full text-left px-4 py-3 text-sm text-brand-white hover:bg-brand-white/5 transition-colors"
                  >
                    {p.first_name} {p.last_name}
                    {p.school_or_team && <span className="text-brand-white/40 ml-2">· {p.school_or_team}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div>
        <label className={labelClass}>Measurables *</label>
        <div className="space-y-3">
          {stats.map((stat, i) => (
            <div key={i} className="flex gap-3 items-center">
              <select
                value={stat.stat_key}
                onChange={(e) => updateStat(i, "stat_key", e.target.value)}
                className="bg-[#0a0a0a] border border-brand-white/10 text-brand-white px-3 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 flex-shrink-0"
              >
                {STAT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={stat.stat_value}
                onChange={(e) => updateStat(i, "stat_value", e.target.value)}
                placeholder='e.g. 4.52"'
                className={inputClass}
              />
              {stats.length > 1 && (
                <button type="button" onClick={() => removeStat(i)} className="text-brand-white/20 hover:text-red-400 transition-colors text-lg flex-shrink-0">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addStat} className="mt-3 text-brand-yellow/60 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors">
          + Add Another Stat
        </button>
      </div>

      {status === "error" && <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>}

      <button
        type="submit"
        disabled={!selected || status === "sending"}
        className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-3 px-8 hover:bg-brand-yellow/90 transition-colors disabled:opacity-40"
      >
        {status === "sending" ? "Submitting…" : "Submit Stats"}
      </button>
    </form>
  );
}

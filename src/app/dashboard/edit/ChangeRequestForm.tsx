"use client";

import { useState } from "react";
import { GUARDED_FIELDS, guardedFieldLabel, type GuardedField } from "@/lib/profile/change-request";

const LEVEL_OPTIONS: { value: string; label: string }[] = [
  { value: "youth", label: "Youth" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
  { value: "national", label: "National Team" },
  { value: "pro", label: "Pro" },
];

interface PlayerBasicInfo {
  id: string;
  first_name: string;
  last_name: string;
  school_or_team: string;
  level: string;
  roster_year: string;
}

function levelLabel(value: string): string {
  return LEVEL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export default function ChangeRequestForm({ player }: { player: PlayerBasicInfo }) {
  const [field, setField] = useState<GuardedField>("first_name");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentValues: Record<GuardedField, string> = {
    first_name: player.first_name,
    last_name: player.last_name,
    school_or_team: player.school_or_team,
    level: player.level ? levelLabel(player.level) : "",
    roster_year: player.roster_year,
  };

  // Raw (non-display) current values, used for no-op comparison — for `level` the
  // submitted `value` is the raw enum, not the human label in `currentValues`.
  const rawCurrentValues: Record<GuardedField, string> = {
    first_name: player.first_name,
    last_name: player.last_name,
    school_or_team: player.school_or_team,
    level: player.level,
    roster_year: player.roster_year,
  };
  const isNoOp = value.trim().length > 0 && value.trim() === (rawCurrentValues[field] ?? "").trim();

  function handleFieldChange(next: GuardedField) {
    setField(next);
    setValue("");
    setSuccess(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    if (isNoOp) {
      setError("That's already the current value.");
      return;
    }
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    const res = await fetch(`/api/players/${player.id}/change-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, new_value: value }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setError("You already have a pending request for this field. Please wait for it to be reviewed.");
      } else {
        setError(body?.error ?? "Something went wrong. Please try again.");
      }
      return;
    }

    setSuccess(true);
    setValue("");
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-brand-white/10" />
        <span className="text-xs font-display uppercase tracking-widest text-brand-white/30">
          Basic Info (needs review)
        </span>
        <div className="h-px flex-1 bg-brand-white/10" />
      </div>

      <p className="text-brand-white/40 text-sm">
        Your name, team, and competition level are protected to prevent impersonation and keep
        rankings fair. Request a change and our team will apply it — usually within a day.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="cr-field" className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
            Field
          </label>
          <select
            id="cr-field"
            value={field}
            onChange={(e) => handleFieldChange(e.target.value as GuardedField)}
            className="w-full bg-[#111111] border border-brand-white/10 text-brand-white px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
          >
            {GUARDED_FIELDS.map((f) => (
              <option key={f} value={f}>
                {guardedFieldLabel(f)}
              </option>
            ))}
          </select>
        </div>

        <p className="text-brand-white/30 text-xs">
          Current: <span className="text-brand-white/60">{currentValues[field] || "—"}</span>
        </p>

        <div>
          <label htmlFor="cr-value" className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
            New value
          </label>
          {field === "level" ? (
            <select
              id="cr-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-[#111111] border border-brand-white/10 text-brand-white px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
            >
              <option value="">Select a level…</option>
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : field === "roster_year" ? (
            <input
              id="cr-value"
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="e.g. 2025"
              className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
            />
          ) : (
            <input
              id="cr-value"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, 120))}
              placeholder={`New ${guardedFieldLabel(field).toLowerCase()}`}
              className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
            />
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-4 py-3" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-sm px-4 py-3 font-display uppercase tracking-widest" role="status">
            Sent for review — we&apos;ll email you when it&apos;s approved.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !value.trim()}
          className="w-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm py-4 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && (
            <span aria-hidden="true" className="animate-spin border-2 border-brand-black border-t-transparent rounded-full w-4 h-4" />
          )}
          Request Change
        </button>
      </form>
    </section>
  );
}

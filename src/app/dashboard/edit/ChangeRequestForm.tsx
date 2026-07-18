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

export interface PendingChangeRequest {
  field: string;
  new_value: string;
  created_at: string;
}

function levelLabel(value: string): string {
  return LEVEL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export default function ChangeRequestForm({
  player,
  pendingRequests,
}: {
  player: PlayerBasicInfo;
  pendingRequests: PendingChangeRequest[];
}) {
  const [pendingByField, setPendingByField] = useState<Record<string, string>>(() =>
    Object.fromEntries(pendingRequests.map((r) => [r.field, r.new_value]))
  );
  const [openField, setOpenField] = useState<GuardedField | null>(null);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
  const isNoOp =
    openField !== null &&
    value.trim().length > 0 &&
    value.trim() === (rawCurrentValues[openField] ?? "").trim();

  function toggleField(field: GuardedField) {
    setOpenField((prev) => (prev === field ? null : field));
    setValue("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!openField || !value.trim()) return;
    if (isNoOp) {
      setError("That's already the current value.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/players/${player.id}/change-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field: openField, new_value: value }),
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

    setPendingByField((prev) => ({ ...prev, [openField]: value.trim() }));
    setOpenField(null);
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
        Your name, team, competition level, and roster year are protected to prevent impersonation
        and keep rankings fair. Request a change and our team will apply it — usually within a day.
      </p>

      <div className="divide-y divide-brand-white/10 border border-brand-white/10">
        {GUARDED_FIELDS.map((field) => {
          const pending = pendingByField[field];
          const isOpen = openField === field;
          return (
            <div key={field} className="bg-[#0d0d0d] p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-display uppercase tracking-widest text-brand-white/50">
                    {guardedFieldLabel(field)}
                  </p>
                  <p className="text-brand-white/70 text-sm mt-1 truncate">
                    {currentValues[field] || "—"}
                  </p>
                </div>
                {pending !== undefined ? (
                  <span className="shrink-0 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-xs px-3 py-1.5">
                    Pending review: &ldquo;{field === "level" ? levelLabel(pending) : pending}&rdquo;
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleField(field)}
                    className="shrink-0 text-brand-yellow text-xs font-display uppercase tracking-widest hover:text-brand-yellow/80 transition-colors"
                  >
                    {isOpen ? "Cancel" : "Request change →"}
                  </button>
                )}
              </div>

              {isOpen && pending === undefined && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {field === "level" ? (
                    <select
                      id={`cr-value-${field}`}
                      aria-label={`New ${guardedFieldLabel(field).toLowerCase()}`}
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
                      id={`cr-value-${field}`}
                      aria-label="New roster year"
                      type="text"
                      inputMode="numeric"
                      value={value}
                      onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="e.g. 2025"
                      className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
                    />
                  ) : (
                    <input
                      id={`cr-value-${field}`}
                      aria-label={`New ${guardedFieldLabel(field).toLowerCase()}`}
                      type="text"
                      value={value}
                      onChange={(e) => setValue(e.target.value.slice(0, 120))}
                      placeholder={`New ${guardedFieldLabel(field).toLowerCase()}`}
                      className="w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors"
                    />
                  )}

                  {error && (
                    <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-4 py-3" role="alert">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !value.trim()}
                    className="w-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm py-3 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting && (
                      <span aria-hidden="true" className="animate-spin border-2 border-brand-black border-t-transparent rounded-full w-4 h-4" />
                    )}
                    Request Change
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

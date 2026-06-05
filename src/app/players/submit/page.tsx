"use client";
import { useState } from "react";
import Link from "next/link";

const POSITIONS = ["QB", "WR", "DB", "Rusher"];
const LEVELS = [
  { value: "high_school", label: "High School" },
  { value: "college",     label: "College" },
  { value: "national",    label: "National Team" },
  { value: "international", label: "International" },
  { value: "youth",       label: "Youth" },
];
const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male",   label: "Male" },
];

const inputCls = "w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="h-px flex-1 bg-brand-white/10" />
      <span className="text-xs font-display uppercase tracking-widest text-brand-white/30">{children}</span>
      <div className="h-px flex-1 bg-brand-white/10" />
    </div>
  );
}

export default function SubmitPlayerPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/players/submit", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-brand-black pt-24 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
          <h2 className="font-display text-3xl uppercase text-brand-yellow mb-3">Profile Submitted!</h2>
          <p className="text-brand-white/60 mb-8 leading-relaxed">
            Thanks for submitting. Our team will review and add you to the database within 48 hours.
          </p>
          <Link
            href="/players"
            className="inline-flex items-center justify-center bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-400 transition-colors"
          >
            Browse Player Database
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-brand-white/50 hover:text-brand-yellow text-sm mb-10 transition-colors group"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          Player Database
        </Link>

        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <h1 className="font-display text-5xl uppercase text-brand-white leading-none">Submit Your Profile</h1>
          <p className="text-brand-white/50 mt-3 text-sm leading-relaxed">
            Get listed in the Talkin Flag player database. Visible to college coaches, scouts, and national team selectors worldwide. Free, always.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* ── Identity ─────────────────────────────────────────── */}
          <SectionLabel>Identity</SectionLabel>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="first_name">
                First Name <span className="text-brand-white/40">*</span>
              </label>
              <input id="first_name" name="first_name" required maxLength={100} className={inputCls} />
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="last_name">
                Last Name <span className="text-brand-white/40">*</span>
              </label>
              <input id="last_name" name="last_name" required maxLength={100} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">
                Gender
              </label>
              <div className="flex gap-2">
                {GENDERS.map((g) => (
                  <label key={g.value} className="flex-1 flex items-center justify-center gap-2 bg-[#111111] border border-brand-white/20 text-brand-white/60 text-xs font-display uppercase tracking-widest py-3 cursor-pointer has-[:checked]:border-brand-yellow has-[:checked]:text-brand-yellow transition-colors">
                    <input type="radio" name="gender" value={g.value} className="sr-only" />
                    {g.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="grad_year">
                Graduating Class
              </label>
              <input
                id="grad_year"
                name="grad_year"
                type="number"
                min={2024} max={2035}
                placeholder="2027"
                className={inputCls}
              />
            </div>
          </div>

          {/* ── Program ──────────────────────────────────────────── */}
          <SectionLabel>Program</SectionLabel>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="position">
                Position <span className="text-brand-white/40">*</span>
              </label>
              <select id="position" name="position" required className={inputCls}>
                <option value="">Select position</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="level">
                Level <span className="text-brand-white/40">*</span>
              </label>
              <select id="level" name="level" required className={inputCls}>
                <option value="">Select level</option>
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="school_or_team">
              School or Team
            </label>
            <input id="school_or_team" name="school_or_team" maxLength={200} placeholder="e.g. Hamilton High School, Team Italy" className={inputCls} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="city">City</label>
              <input id="city" name="city" maxLength={100} placeholder="Phoenix" className={inputCls} />
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="state">State</label>
              <input id="state" name="state" maxLength={50} placeholder="Arizona" className={inputCls} />
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="country">Country</label>
              <input id="country" name="country" maxLength={100} placeholder="USA" className={inputCls} />
            </div>
          </div>

          {/* ── Measurables ──────────────────────────────────────── */}
          <SectionLabel>Measurables (optional)</SectionLabel>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">Height</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type="number" name="height_ft" min={4} max={7} placeholder="5" className={inputCls + " pr-8"} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs pointer-events-none">ft</span>
                </div>
                <div className="relative flex-1">
                  <input type="number" name="height_in_rem" min={0} max={11} placeholder="8" className={inputCls + " pr-8"} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs pointer-events-none">in</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">Weight</label>
              <div className="relative">
                <input type="number" name="weight_lbs" min={80} max={400} placeholder="145" className={inputCls + " pr-10"} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs pointer-events-none">lbs</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">40-Yard</label>
              <div className="relative">
                <input type="number" name="forty_yard" min={3.5} max={8} step={0.01} placeholder="4.6" className={inputCls + " pr-10"} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs pointer-events-none">sec</span>
              </div>
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">Vertical</label>
              <div className="relative">
                <input type="number" name="vertical_jump" min={10} max={60} placeholder="28" className={inputCls + " pr-8"} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs pointer-events-none">in</span>
              </div>
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">Wingspan</label>
              <div className="relative">
                <input type="number" name="wingspan_in" min={48} max={108} placeholder="68" className={inputCls + " pr-8"} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs pointer-events-none">in</span>
              </div>
            </div>
          </div>

          {/* ── Links & Bio ──────────────────────────────────────── */}
          <SectionLabel>Links & Bio</SectionLabel>

          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="highlight_url">
              Highlight Video URL
            </label>
            <input id="highlight_url" name="highlight_url" type="url" maxLength={500} placeholder="https://youtube.com/watch?v=... or hudl.com link" className={inputCls} />
          </div>

          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="instagram">
              Instagram Handle
            </label>
            <div className="flex items-center bg-[#111111] border border-brand-white/20 focus-within:border-brand-yellow transition-colors">
              <span className="pl-4 text-brand-white/30 text-sm select-none">@</span>
              <input id="instagram" name="instagram" maxLength={100} placeholder="yourhandle" className="flex-1 bg-transparent text-brand-white px-2 py-3 text-sm focus:outline-none placeholder:text-brand-white/25" />
            </div>
          </div>

          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="bio">
              Bio
            </label>
            <textarea id="bio" name="bio" rows={4} maxLength={1000} placeholder="Brief description of your athletic background, achievements, and playing style." className={inputCls + " resize-none"} />
          </div>

          {status === "error" && (
            <p className="text-red-400 text-sm" role="alert">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Submitting…" : "Submit Profile"}
          </button>

          <p className="text-brand-white/30 text-xs text-center">
            Profiles are reviewed before appearing in the database.
          </p>
        </form>
      </div>
    </div>
  );
}

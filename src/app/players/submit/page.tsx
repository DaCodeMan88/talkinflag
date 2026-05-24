"use client";
import { useState } from "react";
import Link from "next/link";

const POSITIONS = ["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"];
const LEVELS = [
  { value: "youth", label: "Youth" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
  { value: "national", label: "National" },
  { value: "international", label: "International" },
  { value: "pro", label: "Pro" },
];

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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

        {/* Back link */}
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-brand-white/50 hover:text-brand-yellow text-sm mb-10 transition-colors group"
        >
          <span className="transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
          Player Database
        </Link>

        <h1 className="font-display text-5xl uppercase text-brand-white mb-2">Submit Your Profile</h1>
        <p className="text-brand-white/60 mb-10 leading-relaxed">
          Get listed in the Talkin Flag player database. Visible to college coaches, scouts,
          and national team selectors worldwide. All levels and countries welcome. Free, always.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="first_name">
                First Name <span className="text-brand-white/40">(required)</span>
              </label>
              <input
                id="first_name"
                name="first_name"
                required
                maxLength={100}
                className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="last_name">
                Last Name <span className="text-brand-white/40">(required)</span>
              </label>
              <input
                id="last_name"
                name="last_name"
                required
                maxLength={100}
                className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none"
              />
            </div>
          </div>

          {/* Position & Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="position">
                Position <span className="text-brand-white/40">(required)</span>
              </label>
              <select
                id="position"
                name="position"
                required
                className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none"
              >
                <option value="">Select position</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="level">
                Level <span className="text-brand-white/40">(required)</span>
              </label>
              <select
                id="level"
                name="level"
                required
                className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none"
              >
                <option value="">Select level</option>
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          {/* School / Team */}
          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="school_or_team">
              School or Team
            </label>
            <input
              id="school_or_team"
              name="school_or_team"
              maxLength={200}
              placeholder="e.g. University of Florida, Team Italy"
              className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="country">
              Country
            </label>
            <input
              id="country"
              name="country"
              maxLength={100}
              placeholder="e.g. United States, Italy, Brazil"
              className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
            />
          </div>

          {/* Highlight URL */}
          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="highlight_url">
              Highlight Video URL
            </label>
            <input
              id="highlight_url"
              name="highlight_url"
              type="url"
              maxLength={500}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="instagram">
              Instagram Handle
            </label>
            <input
              id="instagram"
              name="instagram"
              maxLength={100}
              placeholder="@yourhandle"
              className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              maxLength={1000}
              placeholder="Brief description of your athletic background, achievements, and playing style."
              className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none resize-none placeholder:text-brand-white/25"
            />
          </div>

          {/* Error */}
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
            Profiles are reviewed by the Talkin Flag team before appearing in the database.
          </p>
        </form>
      </div>
    </div>
  );
}

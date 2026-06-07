"use client";
import { useState } from "react";
import Link from "next/link";

const LEVELS = [
  { value: "youth", label: "Youth" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
  { value: "national", label: "National" },
  { value: "pro", label: "Pro" },
  { value: "international", label: "International" },
  { value: "olympics", label: "Olympics / World Games" },
];

export default function SubmitEventPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/events/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
          <h2 className="font-display text-3xl uppercase text-brand-yellow mb-3">Event Submitted!</h2>
          <p className="text-brand-white/60 mb-8 leading-relaxed">
            Thanks for submitting. Our team will review and add it to the calendar within 48 hours.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center justify-center bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-400 transition-colors"
          >
            View Events Calendar
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
          href="/events"
          className="inline-flex items-center gap-2 text-brand-white/50 hover:text-brand-yellow text-sm mb-10 transition-colors group"
        >
          <span className="transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
          Events Calendar
        </Link>

        <h1 className="font-display text-5xl uppercase text-brand-white mb-2">Submit an Event</h1>
        <p className="text-brand-white/60 mb-10 leading-relaxed">
          Know of an upcoming flag football event? Submit it here and we&apos;ll add it to the Talkin Flag calendar after review.
          All competition levels and countries welcome.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* Event Name */}
          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="title">
              Event Name <span className="text-brand-white/40">(required)</span>
            </label>
            <input
              id="title"
              name="title"
              required
              maxLength={200}
              placeholder="e.g. IFAF Flag Football World Championship 2026"
              className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="start_date">
                Start Date <span className="text-brand-white/40">(required)</span>
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                required
                className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="end_date">
                End Date
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="city">
                City
              </label>
              <input
                id="city"
                name="city"
                maxLength={100}
                placeholder="e.g. Rome"
                className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
              />
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="country">
                Country
              </label>
              <input
                id="country"
                name="country"
                maxLength={100}
                placeholder="e.g. Italy"
                className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
              />
            </div>
          </div>

          {/* Level & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="level">
                Competition Level
              </label>
              <select
                id="level"
                name="level"
                className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none"
              >
                <option value="">Select level</option>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="event_type">
                Event Type
              </label>
              <input
                id="event_type"
                name="event_type"
                maxLength={100}
                placeholder="e.g. Tournament, Championship"
                className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="website_url">
              Official Website
            </label>
            <input
              id="website_url"
              name="website_url"
              type="url"
              maxLength={500}
              placeholder="https://yourEvent.com"
              className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
            />
          </div>

          {/* Submitter Email */}
          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="submitter_email">
              Your Email <span className="text-brand-white/40">(optional — so we can follow up)</span>
            </label>
            <input
              id="submitter_email"
              name="submitter_email"
              type="email"
              maxLength={200}
              placeholder="you@example.com"
              className="w-full bg-[#111111] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={1000}
              placeholder="Brief description of the event, format, registration info, etc."
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
            {status === "loading" ? "Submitting…" : "Submit Event"}
          </button>

          <p className="text-brand-white/30 text-xs text-center">
            Submissions are reviewed by the Talkin Flag team before appearing on the calendar.
          </p>
        </form>
      </div>
    </div>
  );
}

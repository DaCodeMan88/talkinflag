"use client";
import { useState } from "react";
import Link from "next/link";

type Subject = "Podcast Feature" | "Player Submission" | "Partnership / Sponsorship" | "Press" | "Other";
type Status = "idle" | "loading" | "success" | "error";

const SUBJECTS: { value: Subject; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "Podcast Feature",
    label: "Podcast Feature",
    description: "Pitch a story, guest appearance, or episode idea",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22"/>
      </svg>
    ),
  },
  {
    value: "Player Submission",
    label: "Player Submission",
    description: "Get yourself or a player into the database",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    value: "Partnership / Sponsorship",
    label: "Partnership",
    description: "Brand deals, sponsorships, collaborations",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    value: "Press",
    label: "Press",
    description: "Media inquiries, interviews, press kits",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    value: "Other",
    label: "Other",
    description: "Anything else on your mind",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

const SUCCESS_COPY: Record<Subject, string> = {
  "Podcast Feature": "We review every pitch personally. If it's a fit, you'll hear from us within a few days.",
  "Player Submission": "We'll review the submission and add it to the database. Thanks for helping build the community.",
  "Partnership / Sponsorship": "We'll look over your message and get back to you if there's a fit. Thanks for reaching out.",
  "Press": "We'll get you what you need. Expect a response within 48 hours.",
  "Other": "We read everything. You'll hear from us soon.",
};

const MESSAGE_MAX = 2000;

export function ContactForm() {
  const [subject, setSubject] = useState<Subject>("Podcast Feature");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [msgLength, setMsgLength] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validateField(name: string, value: string) {
    if (name === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Enter a valid email address";
    }
    return "";
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const err = validateField(e.target.name, e.target.value);
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: err }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, subject }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center py-16 px-4">
        {/* Checkmark */}
        <div className="w-16 h-16 rounded-full border-2 border-brand-yellow flex items-center justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-yellow" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-3">Message Sent</p>
        <h2 className="font-display text-3xl md:text-4xl uppercase text-brand-white mb-4 leading-tight">
          We Got It
        </h2>
        <p className="text-brand-white/60 text-sm max-w-sm mb-10 leading-relaxed">
          {SUCCESS_COPY[subject]}
        </p>
        <button
          onClick={() => { setStatus("idle"); setMsgLength(0); setFieldErrors({}); }}
          className="font-display text-xs uppercase tracking-widest text-brand-white/40 hover:text-brand-yellow transition-colors"
        >
          ← Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Subject cards */}
      <fieldset className="mb-10">
        <legend className="font-display text-xs uppercase tracking-widest text-brand-white/50 mb-4">
          What&apos;s this about?
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SUBJECTS.map(({ value, label, description, icon }) => {
            const active = subject === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSubject(value)}
                className={`group text-left p-4 transition-all duration-150 border ${
                  active
                    ? "border-brand-yellow bg-brand-yellow/5"
                    : "border-brand-white/10 hover:border-brand-white/30 bg-[#111111]"
                }`}
                aria-pressed={active}
              >
                <div className={`mb-2 transition-colors ${active ? "text-brand-yellow" : "text-brand-white/40 group-hover:text-brand-white/60"}`}>
                  {icon}
                </div>
                <p className={`font-display text-xs uppercase tracking-widest mb-1 transition-colors ${active ? "text-brand-yellow" : "text-brand-white/70 group-hover:text-brand-white"}`}>
                  {label}
                </p>
                <p className="text-brand-white/40 text-xs leading-snug">{description}</p>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <div>
          <label htmlFor="name" className="block font-display text-xs uppercase tracking-widest text-brand-white/50 mb-2">
            Name <span className="text-brand-yellow" aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            className="w-full bg-[#111111] border border-brand-white/15 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="email" className="block font-display text-xs uppercase tracking-widest text-brand-white/50 mb-2">
            Email <span className="text-brand-yellow" aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            onBlur={handleBlur}
            className={`w-full bg-[#111111] border text-brand-white px-4 py-3 text-sm focus:outline-none placeholder:text-brand-white/25 transition-colors ${
              fieldErrors.email ? "border-red-500 focus:border-red-400" : "border-brand-white/15 focus:border-brand-yellow"
            }`}
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-red-400 text-xs">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-2">
          <label htmlFor="message" className="font-display text-xs uppercase tracking-widest text-brand-white/50">
            Message <span className="text-brand-yellow" aria-hidden="true">*</span>
          </label>
          {msgLength > 0 && (
            <span className={`text-xs tabular-nums transition-colors ${msgLength > MESSAGE_MAX * 0.9 ? "text-brand-yellow" : "text-brand-white/30"}`}>
              {msgLength} / {MESSAGE_MAX}
            </span>
          )}
        </div>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={MESSAGE_MAX}
          placeholder="Tell us what's on your mind…"
          onChange={(e) => setMsgLength(e.target.value.length)}
          className="w-full bg-[#111111] border border-brand-white/15 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25 resize-none transition-colors leading-relaxed"
        />
      </div>

      {/* Error banner */}
      {status === "error" && (
        <div className="mb-6 border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-6">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center gap-3 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Sending…
            </>
          ) : (
            <>Send Message →</>
          )}
        </button>
        <Link
          href="/"
          className="font-display text-xs uppercase tracking-widest text-brand-white/30 hover:text-brand-white/60 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

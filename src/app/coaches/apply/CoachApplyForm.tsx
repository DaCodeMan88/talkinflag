"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LEVELS = [
  { value: "high_school", label: "High School" },
  { value: "college", label: "College / NCAA" },
  { value: "national", label: "National Team" },
];

export default function CoachApplyForm({ userEmail }: { userEmail: string }) {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [title, setTitle] = useState("");
  const [team, setTeam] = useState("");
  const [level, setLevel] = useState("");
  const [yearsCoaching, setYearsCoaching] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!level) { setError("Please select a level"); return; }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/coaches/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        title,
        team,
        level,
        years_coaching: yearsCoaching || null,
        bio,
        phone: phone || null,
        website: website || null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 409) {
        router.refresh();
      } else {
        setError(data.error ?? "Something went wrong");
      }
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-[#0d0d0d] border border-brand-yellow/20 p-10 text-center space-y-4">
        <div className="text-brand-yellow font-display text-5xl">✓</div>
        <h2 className="font-display text-2xl uppercase text-brand-white">Application Submitted</h2>
        <p className="text-brand-white/50 text-sm leading-relaxed max-w-sm mx-auto">
          We&apos;ll review your application and email {email} within a few days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Identity */}
      <section className="space-y-4">
        <SectionDivider label="Your Details" />

        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" required>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={inputCls}
              placeholder="Ambra"
            />
          </Field>
          <Field label="Last Name" required>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className={inputCls}
              placeholder="Marcucci"
            />
          </Field>
        </div>

        <Field label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputCls}
          />
        </Field>

        <Field label="Coach Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Head Coach, Offensive Coordinator..."
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className={inputCls}
            />
          </Field>
          <Field label="Website / LinkedIn">
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Program */}
      <section className="space-y-4">
        <SectionDivider label="Your Program" />

        <Field label="Team / Program Name" required>
          <input
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            required
            placeholder="e.g. University of Oregon Women's Flag, Italy Women's National Team"
            className={inputCls}
          />
        </Field>

        <Field label="Level" required>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLevel(l.value)}
                className={`py-3 px-4 text-xs font-display uppercase tracking-widest border transition-colors ${
                  level === l.value
                    ? "bg-brand-yellow text-brand-black border-brand-yellow"
                    : "bg-transparent text-brand-white/50 border-brand-white/15 hover:border-brand-white/30"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Years Coaching">
          <div className="relative w-32">
            <input
              type="number"
              value={yearsCoaching}
              onChange={(e) => setYearsCoaching(e.target.value)}
              min={0} max={40}
              placeholder="5"
              className={inputCls + " pr-10"}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/30 text-xs">yrs</span>
          </div>
        </Field>

        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 1000))}
            rows={4}
            placeholder="Tell us about your coaching background, programs you've worked with, and any notable achievements..."
            className={inputCls + " resize-none"}
          />
          <p className="text-brand-white/20 text-xs text-right mt-1">{bio.length}/1000</p>
        </Field>
      </section>

      {/* Disclaimer */}
      <div className="bg-brand-white/5 border border-brand-white/10 px-5 py-4 text-brand-white/40 text-xs leading-relaxed">
        By submitting, you confirm that you are a legitimate coach at the program listed. Talkin Flag will review your application and may reach out to verify. False applications will be removed.
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm py-4 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && (
          <span className="animate-spin border-2 border-brand-black border-t-transparent rounded-full w-4 h-4" />
        )}
        Submit Application
      </button>
    </form>
  );
}

const inputCls =
  "w-full bg-[#111111] border border-brand-white/10 text-brand-white placeholder-brand-white/20 px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 transition-colors";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-display uppercase tracking-widest text-brand-white/50 mb-2">
        {label}{required && <span className="text-brand-yellow ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-brand-white/10" />
      <span className="text-xs font-display uppercase tracking-widest text-brand-white/30">{label}</span>
      <div className="h-px flex-1 bg-brand-white/10" />
    </div>
  );
}

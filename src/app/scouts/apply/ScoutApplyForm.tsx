"use client";

import { useState } from "react";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
};

export default function ScoutApplyForm({ defaultName = "", defaultEmail = "" }: Props) {
  const [form, setForm] = useState({
    full_name: defaultName,
    email: defaultEmail,
    location: "",
    affiliation: "",
    event_history: "",
    why_flag: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/scouts/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setStatus(res.ok ? "done" : "error");
  }

  const inputClass =
    "w-full bg-[#0a0a0a] border border-brand-white/10 text-brand-white px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 placeholder:text-brand-white/20";
  const labelClass =
    "block text-brand-white/40 text-xs font-display uppercase tracking-widest mb-2";

  if (status === "done") {
    return (
      <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-8 text-center space-y-3">
        <p className="font-display text-2xl uppercase text-brand-yellow">Application Received</p>
        <p className="text-brand-white/60 text-sm">
          We&apos;ll review your application and reach out within a few days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Full Name *</label>
          <input required type="text" value={form.full_name} onChange={set("full_name")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input required type="email" value={form.email} onChange={set("email")} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Location (City, State/Country) *</label>
        <input required type="text" value={form.location} onChange={set("location")} placeholder="e.g. Atlanta, GA" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Affiliation / Organization</label>
        <input type="text" value={form.affiliation} onChange={set("affiliation")} placeholder="e.g. All22, NFL FLAG, independent" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Event History</label>
        <textarea
          value={form.event_history}
          onChange={set("event_history")}
          rows={3}
          placeholder="Events you've attended, run, or organized…"
          className={inputClass + " resize-none"}
        />
      </div>

      <div>
        <label className={labelClass}>Why do you want to scout flag football? *</label>
        <textarea
          required
          value={form.why_flag}
          onChange={set("why_flag")}
          rows={4}
          placeholder="Tell us about your passion for flag football and what you'd bring as a scout…"
          className={inputClass + " resize-none"}
        />
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm font-display">Something went wrong. Try again.</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-3 px-8 hover:bg-brand-yellow/90 transition-colors disabled:opacity-60"
      >
        {status === "sending" ? "Submitting…" : "Submit Application"}
      </button>
    </form>
  );
}

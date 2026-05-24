"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const POSITIONS = ["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"];
const LEVELS = ["high_school", "college", "national", "pro"];

export default function SubmitPlayerPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("/api/players/submit", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    setStatus(res.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-brand-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-4xl uppercase text-brand-yellow">Profile Submitted!</h2>
          <p className="mt-4 text-brand-white/60">We'll review and add you to the database within 48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="font-display text-5xl uppercase text-brand-white mb-2">Submit Your Profile</h1>
        <p className="text-brand-white/60 mb-10">Get listed in the Talkin Flag player database. Visible to college coaches and scouts worldwide.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">First Name *</label>
              <input name="first_name" required className="w-full bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none" />
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">Last Name *</label>
              <input name="last_name" required className="w-full bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">Position *</label>
              <select name="position" required className="w-full bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none">
                <option value="">Select position</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">Level *</label>
              <select name="level" required className="w-full bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none">
                <option value="">Select level</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l.replaceAll("_", " ")}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">School or Team</label>
            <input name="school_or_team" className="w-full bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none" />
          </div>

          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">Country</label>
            <input name="country" className="w-full bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none" placeholder="e.g. United States, Italy, Brazil" />
          </div>

          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">Highlight Video URL</label>
            <input name="highlight_url" type="url" className="w-full bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none" placeholder="https://youtube.com/watch?v=..." />
          </div>

          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">Instagram Handle</label>
            <input name="instagram" className="w-full bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-3 text-sm focus:border-brand-yellow focus:outline-none" placeholder="@yourhandle" />
          </div>

          <div>
            <label className="block text-brand-yellow text-xs font-display uppercase tracking-widest mb-2">Bio</label>
            <textarea name="bio" rows={3} className="w-full bg-[#222222] border border-brand-white/20 text-brand-white px-4 py-3 text-sm resize-none focus:border-brand-yellow focus:outline-none" />
          </div>

          {status === "error" && (
            <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Submitting..." : "Submit Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}

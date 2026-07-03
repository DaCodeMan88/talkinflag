"use client";

import { useState } from "react";

export default function ReportProfileButton({ playerId }: { playerId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit() {
    setStatus("loading");
    try {
      const res = await fetch(`/api/players/${playerId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, reporter_email: email }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-brand-white/25 text-xs hover:text-brand-white/50 transition-colors underline underline-offset-2"
      >
        Not you? Report this profile
      </button>
    );
  }

  return (
    <div className="bg-[#0d0d0d] border border-brand-white/10 p-5 space-y-3 max-w-sm">
      {status === "success" ? (
        <p className="text-brand-white/60 text-sm">Thanks — our team will take a look.</p>
      ) : (
        <>
          <p className="text-brand-white text-sm font-display uppercase tracking-widest">Report This Profile</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What's wrong? (optional)"
            maxLength={500}
            rows={3}
            className="w-full bg-[#111111] border border-brand-white/20 text-brand-white placeholder-brand-white/25 px-3 py-2 text-sm focus:outline-none focus:border-brand-yellow/50"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email (optional)"
            maxLength={254}
            className="w-full bg-[#111111] border border-brand-white/20 text-brand-white placeholder-brand-white/25 px-3 py-2 text-sm focus:outline-none focus:border-brand-yellow/50"
          />
          {status === "error" && <p className="text-red-400 text-xs">Something went wrong. Please try again.</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={submit}
              disabled={status === "loading"}
              className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-4 hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
            >
              Submit
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-brand-white/40 text-xs hover:text-brand-white/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

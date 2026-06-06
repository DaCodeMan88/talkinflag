"use client";

import { useState, useTransition, useRef } from "react";

const PLAY_TYPES = [
  { value: "touchdown", label: "Touchdown" },
  { value: "interception", label: "Interception" },
  { value: "rush", label: "Rush / Run" },
  { value: "one-handed catch", label: "One-Handed Catch" },
  { value: "defensive play", label: "Defensive Play" },
  { value: "other", label: "Other" },
];

async function submitHighlight(formData: FormData) {
  const res = await fetch("/api/highlights/submit", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? "Submission failed");
  }
}

export function HighlightSubmitForm({ playerId }: { playerId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    fd.set("player_id", playerId);
    startTransition(async () => {
      try {
        await submitHighlight(fd);
        setSuccess(true);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  if (success) {
    return (
      <div className="bg-[#0d0d0d] border border-brand-white/10 p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-green-400 text-lg">✓</span>
          <h2 className="font-display text-xl uppercase text-brand-white">Highlight Submitted!</h2>
        </div>
        <p className="text-brand-white/40 text-sm mb-4">
          Your highlight is under review. You'll appear on the Top 10 if selected.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-brand-yellow font-display uppercase tracking-widest text-xs hover:underline"
        >
          Submit Another →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d0d] border border-brand-white/10 p-6">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="font-display text-xl uppercase text-brand-white">Submit a Highlight</h2>
        <span className="text-brand-white/20 text-xs font-display uppercase tracking-widest border border-brand-white/10 px-2 py-0.5">
          Top 10 Plays
        </span>
      </div>
      <p className="text-brand-white/40 text-sm mb-5">
        Submit your best play for a chance to be featured in Talkin Flag's Top 10 Plays of the Week.
      </p>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Video URL */}
        <div>
          <label className="block text-brand-white/50 text-xs uppercase tracking-widest mb-1.5">
            YouTube or Video URL <span className="text-brand-yellow">*</span>
          </label>
          <input
            type="url"
            name="video_url"
            required
            placeholder="https://youtube.com/watch?v=..."
            className="w-full bg-brand-white/5 border border-brand-white/10 text-brand-white px-4 py-2.5 text-sm focus:outline-none focus:border-brand-yellow/50 placeholder:text-brand-white/20"
          />
        </div>

        {/* Play type */}
        <div>
          <label className="block text-brand-white/50 text-xs uppercase tracking-widest mb-1.5">
            Play Type
          </label>
          <select
            name="play_type"
            className="w-full bg-[#111] border border-brand-white/10 text-brand-white px-4 py-2.5 text-sm focus:outline-none focus:border-brand-yellow/50"
          >
            <option value="">Select a play type…</option>
            {PLAY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-brand-white/50 text-xs uppercase tracking-widest mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            rows={2}
            maxLength={280}
            placeholder="Describe the play in a sentence or two…"
            className="w-full bg-brand-white/5 border border-brand-white/10 text-brand-white px-4 py-2.5 text-sm focus:outline-none focus:border-brand-yellow/50 resize-none placeholder:text-brand-white/20"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2.5 px-6 hover:bg-brand-yellow/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Submitting…" : "Submit Highlight →"}
        </button>
      </form>
    </div>
  );
}

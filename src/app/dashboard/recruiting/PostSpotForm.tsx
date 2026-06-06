"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const POSITIONS = ["QB", "WR", "DB", "Rusher", "Any"];

export default function PostSpotForm() {
  const router = useRouter();
  const [position, setPosition] = useState("Any");
  const [targetGradYear, setTargetGradYear] = useState("");
  const [statePref, setStatePref] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/coaches/spots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        position: position === "Any" ? null : position,
        target_grad_year: targetGradYear ? parseInt(targetGradYear) : null,
        state_pref: statePref || null,
        description: description || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to post spot.");
    } else {
      setSuccess(true);
      setPosition("Any");
      setTargetGradYear("");
      setStatePref("");
      setDescription("");
      router.refresh();
    }
    setLoading(false);
  }

  const inputClass =
    "w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[#FDDD58] transition-colors";

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h3 className="font-display text-lg text-[#FDDD58]">Post a New Roster Spot</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className={inputClass}
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Target Class Year (optional)</label>
          <input
            type="number"
            value={targetGradYear}
            onChange={(e) => setTargetGradYear(e.target.value)}
            placeholder="e.g. 2026"
            min={2024}
            max={2035}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">State Preference (optional)</label>
        <input
          type="text"
          value={statePref}
          onChange={(e) => setStatePref(e.target.value.slice(0, 100))}
          placeholder="e.g. TX, CA, or leave blank"
          maxLength={100}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          placeholder="Describe the spot, system fit, requirements..."
          maxLength={500}
          rows={3}
          className={inputClass}
        />
        <p className="text-xs text-zinc-600 mt-1">{description.length}/500</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">Spot posted!</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-[#FDDD58] text-black font-display px-5 py-2 rounded hover:bg-yellow-300 transition-colors disabled:opacity-50"
      >
        {loading ? "Posting…" : "Post Spot"}
      </button>
    </form>
  );
}

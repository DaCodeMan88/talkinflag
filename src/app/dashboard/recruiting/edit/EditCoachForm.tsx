"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  title: string | null;
  years_coaching: number | null;
  wins: number | null;
  losses: number | null;
  philosophy: string | null;
  bio: string | null;
};

export default function EditCoachForm(props: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: props.title ?? "",
    years_coaching: props.years_coaching?.toString() ?? "",
    wins: props.wins?.toString() ?? "",
    losses: props.losses?.toString() ?? "",
    philosophy: props.philosophy ?? "",
    bio: props.bio ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/coaches/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Something went wrong");
      return;
    }
    setSaved(true);
    setTimeout(() => {
      router.push("/dashboard/recruiting");
      router.refresh();
    }, 1000);
  }

  const inputClass =
    "w-full bg-[#0a0a0a] border border-brand-white/10 text-brand-white px-4 py-3 text-sm focus:outline-none focus:border-brand-yellow/50 placeholder:text-brand-white/20";

  const labelClass = "block text-brand-white/40 text-xs font-display uppercase tracking-widest mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Title / Role</label>
          <input
            type="text"
            value={form.title}
            onChange={set("title")}
            placeholder="e.g. Head Coach"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Years Coaching</label>
          <input
            type="number"
            value={form.years_coaching}
            onChange={set("years_coaching")}
            placeholder="e.g. 5"
            min={0}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Wins</label>
          <input
            type="number"
            value={form.wins}
            onChange={set("wins")}
            placeholder="e.g. 24"
            min={0}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Losses</label>
          <input
            type="number"
            value={form.losses}
            onChange={set("losses")}
            placeholder="e.g. 8"
            min={0}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Coaching Philosophy</label>
        <textarea
          value={form.philosophy}
          onChange={set("philosophy")}
          placeholder="Your coaching philosophy in one or two sentences…"
          rows={3}
          className={inputClass + " resize-none"}
        />
      </div>

      <div>
        <label className={labelClass}>Bio</label>
        <textarea
          value={form.bio}
          onChange={set("bio")}
          placeholder="Background, experience, coaching highlights…"
          rows={5}
          className={inputClass + " resize-none"}
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm font-display">{error}</p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving || saved}
          className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-3 px-8 hover:bg-brand-yellow/90 transition-colors disabled:opacity-60"
        >
          {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
        </button>
        <a
          href="/dashboard/recruiting"
          className="text-brand-white/40 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

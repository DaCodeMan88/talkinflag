"use client";
import { useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

const ROLES = ["Regional", "Event Coverage", "Campus", "Not sure yet"];

const inputCls =
  "w-full bg-[#111111] border border-brand-white/10 px-4 py-3 text-brand-white text-sm placeholder:text-brand-white/25 focus:outline-none focus:border-brand-yellow";
const labelCls = "block font-display text-xs uppercase tracking-widest text-brand-white/50 mb-2";

function Radio({ name, value, label, checked, onChange }: { name: string; value: string; label: string; checked: boolean; onChange: (v: string) => void }) {
  return (
    <label className={`flex-1 cursor-pointer border px-4 py-3 text-sm text-center transition-colors ${checked ? "border-brand-yellow text-brand-yellow bg-brand-yellow/5" : "border-brand-white/10 text-brand-white/60 hover:border-brand-white/30"}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      {label}
    </label>
  );
}

export function FlaggerForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [badFields, setBadFields] = useState<string[]>([]);
  const [ageBand, setAgeBand] = useState("18plus");
  const [athlete, setAthlete] = useState("no");
  const renderedAt = useRef(0);

  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    setBadFields([]);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/flaggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          track: "flagger",
          international: "no",
          age_band: ageBand,
          athlete,
          rendered_at: renderedAt.current,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (Array.isArray(json.fields)) setBadFields(json.fields);
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
      <div className="text-center py-16 px-4">
        <p className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-3">Application received</p>
        <h2 className="font-display text-3xl md:text-4xl uppercase text-brand-white mb-4 leading-tight">Thanks for applying</h2>
        <p className="text-brand-white/60 text-sm max-w-sm mx-auto leading-relaxed">
          Check your email for what happens next.
        </p>
      </div>
    );
  }

  const bad = (f: string) => (badFields.includes(f) ? " border-red-500" : "");

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Honeypot: hidden from people, filled by bots */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="flagger-website">Leave this field empty</label>
        <input id="flagger-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className={labelCls}>Name *</label>
          <input id="name" name="name" required className={inputCls + bad("name")} />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>Email *</label>
          <input id="email" name="email" type="email" required className={inputCls + bad("email")} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="location" className={labelCls}>Where you can cover games *</label>
          <input id="location" name="location" required placeholder="City, state" className={inputCls + bad("location")} />
        </div>
        <div>
          <label htmlFor="availability" className={labelCls}>Availability</label>
          <input id="availability" name="availability" placeholder="e.g. weekends, 2 games a month" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="school" className={labelCls}>School (if you are a student)</label>
          <input id="school" name="school" className={inputCls} />
        </div>
        <div>
          <label htmlFor="role_interest" className={labelCls}>Role you are interested in</label>
          <select id="role_interest" name="role_interest" className={inputCls} defaultValue="">
            <option value="">Choose one</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="equipment" className={labelCls}>What you film with</label>
        <input id="equipment" name="equipment" placeholder="e.g. phone, gimbal, mic" className={inputCls} />
      </div>
      <div>
        <label htmlFor="experience" className={labelCls}>Experience</label>
        <textarea id="experience" name="experience" rows={3} maxLength={500} placeholder="Media, writing, flag football, anything relevant" className={inputCls} />
      </div>
      <div>
        <label htmlFor="links" className={labelCls}>Links to your work</label>
        <input id="links" name="links" placeholder="Instagram, TikTok, YouTube, articles" className={inputCls} />
      </div>

      <fieldset>
        <legend className={labelCls}>Age</legend>
        <div className="flex gap-3">
          <Radio name="age_band" value="18plus" label="18 or older" checked={ageBand === "18plus"} onChange={setAgeBand} />
          <Radio name="age_band" value="under18" label="Under 18" checked={ageBand === "under18"} onChange={setAgeBand} />
        </div>
        {ageBand === "under18" && (
          <p data-testid="guardian-line" className="mt-3 text-sm text-brand-yellow/80">
            Our first group is adults. You can still apply: a parent or guardian will need to confirm before anything else happens.
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className={labelCls}>Do you currently play college sports?</legend>
        <div className="flex gap-3">
          <Radio name="athlete" value="no" label="No" checked={athlete === "no"} onChange={setAthlete} />
          <Radio name="athlete" value="yes" label="Yes" checked={athlete === "yes"} onChange={setAthlete} />
        </div>
        {athlete === "yes" && (
          <p className="mt-3 text-sm text-brand-white/50">
            Thanks for telling us. We check your school&apos;s rules before anything else happens.
          </p>
        )}
      </fieldset>

      {status === "error" && <p role="alert" className="text-sm text-red-400">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-8 py-4 hover:bg-yellow-400 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Sending..." : "Apply to be a Flagger"}
      </button>
    </form>
  );
}

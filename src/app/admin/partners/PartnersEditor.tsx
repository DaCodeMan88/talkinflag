"use client";

import { useRef, useState, useTransition } from "react";
import type { Partner } from "@/lib/partners";
import { addPartner, deletePartner, movePartner, setPartnerLive, updatePartner } from "./actions";

const input =
  "w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FDDD58]/50";
const smallBtn =
  "text-xs font-display uppercase tracking-widest px-2 py-1 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-30";

export function PartnersEditor({ partners }: { partners: Required<Partner>[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [armedDelete, setArmedDelete] = useState<string | null>(null);
  const addRef = useRef<HTMLFormElement>(null);

  function run(fn: () => Promise<{ error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
      else after?.();
    });
  }

  return (
    <div className="space-y-10 max-w-3xl">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <section className="space-y-2">
        {partners.length === 0 && <p className="text-white/30 text-sm">No partners yet.</p>}
        {partners.map((p, i) => (
          <div key={p.id} className={`bg-[#0d0d0d] border px-4 py-3 ${p.is_live ? "border-white/10" : "border-white/5 opacity-60"}`}>
            {editing === p.id ? (
              <form
                className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2 items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  run(() => updatePartner(p.id, fd), () => setEditing(null));
                }}
              >
                <input name="name" defaultValue={p.name} aria-label="Partner name" className={input} required />
                <input name="url" defaultValue={p.url} aria-label="Partner link" className={input} required />
                <div className="flex gap-2">
                  <button type="submit" disabled={isPending} className={smallBtn}>Save</button>
                  <button type="button" onClick={() => setEditing(null)} className={smallBtn}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">
                    {p.name} {!p.is_live && <span className="text-white/40 font-normal">(hidden)</span>}
                  </p>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-white/40 text-xs hover:text-[#FDDD58] break-all">
                    {p.url} ↗
                  </a>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button disabled={isPending || i === 0} onClick={() => run(() => movePartner(p.id, -1))} className={smallBtn} aria-label={`Move ${p.name} up`}>↑</button>
                  <button disabled={isPending || i === partners.length - 1} onClick={() => run(() => movePartner(p.id, 1))} className={smallBtn} aria-label={`Move ${p.name} down`}>↓</button>
                  <button disabled={isPending} onClick={() => setEditing(p.id)} className={smallBtn}>Edit</button>
                  <button disabled={isPending} onClick={() => run(() => setPartnerLive(p.id, !p.is_live))} className={smallBtn}>
                    {p.is_live ? "Hide" : "Show"}
                  </button>
                  {armedDelete === p.id ? (
                    <button
                      disabled={isPending}
                      onClick={() => run(() => deletePartner(p.id), () => setArmedDelete(null))}
                      className="text-xs font-display uppercase tracking-widest px-2 py-1 border border-red-500/60 text-red-400"
                    >
                      Delete forever
                    </button>
                  ) : (
                    <button disabled={isPending} onClick={() => setArmedDelete(p.id)} className={smallBtn}>Delete</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <p className="text-white/25 text-xs">
          Hide keeps a partner for later. Delete removes it for good. The homepage updates within a minute.
        </p>
      </section>

      <section>
        <h2 className="font-display text-sm uppercase tracking-widest text-white/40 mb-4">Add Partner</h2>
        <form
          ref={addRef}
          className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2 items-start"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() => addPartner(fd), () => addRef.current?.reset());
          }}
        >
          <input name="name" placeholder="Partner name" aria-label="Partner name" className={input} required />
          <input name="url" placeholder="https://" aria-label="Partner link" className={input} required />
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#FDDD58] text-black font-display uppercase tracking-widest px-5 py-2 text-sm hover:bg-[#FDDD58]/80 transition-colors disabled:opacity-40"
          >
            Add →
          </button>
        </form>
      </section>
    </div>
  );
}

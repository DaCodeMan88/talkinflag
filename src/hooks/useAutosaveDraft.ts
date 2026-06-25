"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reconcileDraft, type StoredDraft } from "./reconcileDraft";

export type DraftKind = "quiz:coach" | "quiz:general" | "profile" | "eval" | "career_update";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type ResumableDraft<T> = { value: T; updatedAt: string; source: "local" | "server" };

type Options<T> = {
  kind: DraftKind;
  ref?: string;
  /** The current form value to autosave (controlled by the component). */
  value: T;
  /** Turn the whole mechanism on/off (e.g. once results are shown). */
  enabled?: boolean;
  /** Server debounce in ms. localStorage is always written instantly. */
  debounceMs?: number;
  /** Optional: treat a value as "empty" so we don't offer it for resume. */
  isEmpty?: (value: T) => boolean;
};

type Result<T> = {
  status: SaveStatus;
  /** A draft newer than this session's starting value, if one exists. */
  resumable: ResumableDraft<T> | null;
  /** Apply the resumable draft: returns its value and dismisses the banner. */
  resume: () => T | null;
  /** Dismiss the resume banner without applying it. */
  dismissResume: () => void;
  /** Clear the draft everywhere (call on successful submit/complete). */
  clear: () => Promise<void>;
};

const stable = (v: unknown) => {
  try { return JSON.stringify(v); } catch { return ""; }
};

export function useAutosaveDraft<T>(opts: Options<T>): Result<T> {
  const { kind, value, enabled = true, debounceMs = 1500, isEmpty } = opts;
  const ref = opts.ref ?? "";
  const storageKey = `tf-draft:${kind}:${ref}`;

  const [status, setStatus] = useState<SaveStatus>("idle");
  const [resumable, setResumable] = useState<ResumableDraft<T> | null>(null);

  // Capture the value the component started with so we only offer to resume a
  // draft that actually differs from where the user is now.
  const initialRef = useRef<string>(stable(value));
  const hydratedRef = useRef(false);
  const resolvedRef = useRef(false);          // resume offered & decided?
  const lastSavedRef = useRef<string>(stable(value));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readLocal = useCallback((): StoredDraft<T> => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw) as StoredDraft<T>;
    } catch {
      return null;
    }
  }, [storageKey]);

  const writeLocal = useCallback((v: T) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ value: v, updatedAt: new Date().toISOString() }));
    } catch { /* quota / unavailable — server still has it */ }
  }, [storageKey]);

  const clearLocal = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* noop */ }
  }, [storageKey]);

  // ── Hydrate: reconcile local + server, decide whether to offer a resume ──
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const local = readLocal();
      let server: StoredDraft<T> = null;
      try {
        const res = await fetch(`/api/drafts?kind=${encodeURIComponent(kind)}&ref=${encodeURIComponent(ref)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.draft) server = { value: json.draft.data as T, updatedAt: json.draft.updated_at };
        }
      } catch { /* offline — local only */ }
      if (cancelled) return;

      const winner = reconcileDraft<T>(local, server);
      hydratedRef.current = true;

      const differs = winner && stable(winner.value) !== initialRef.current;
      const notEmpty = winner && (!isEmpty || !isEmpty(winner.value));
      if (winner && differs && notEmpty) {
        const source: "local" | "server" = winner === server ? "server" : "local";
        setResumable({ value: winner.value, updatedAt: winner.updatedAt, source });
      } else {
        resolvedRef.current = true; // nothing to offer — free to autosave
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, kind, ref]);

  // ── Autosave on value change ────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !hydratedRef.current) return;
    // Don't clobber a pending resume offer with the untouched starting form.
    if (!resolvedRef.current) return;
    const serialized = stable(value);
    if (serialized === lastSavedRef.current) return;

    writeLocal(value);
    setStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/drafts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, ref, data: value }),
        });
        if (!res.ok) throw new Error("save failed");
        lastSavedRef.current = serialized;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, debounceMs);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enabled]);

  const resume = useCallback((): T | null => {
    const v = resumable?.value ?? null;
    resolvedRef.current = true;
    // Treat the resumed value as the baseline so we don't immediately re-save it.
    lastSavedRef.current = stable(v);
    setResumable(null);
    return v;
  }, [resumable]);

  const dismissResume = useCallback(() => {
    resolvedRef.current = true;
    setResumable(null);
  }, []);

  const clear = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearLocal();
    lastSavedRef.current = stable(null);
    setStatus("idle");
    try {
      await fetch(`/api/drafts?kind=${encodeURIComponent(kind)}&ref=${encodeURIComponent(ref)}`, { method: "DELETE" });
    } catch { /* best-effort */ }
  }, [kind, ref, clearLocal]);

  return { status, resumable, resume, dismissResume, clear };
}

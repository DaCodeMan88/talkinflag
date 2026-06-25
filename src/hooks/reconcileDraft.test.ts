import { test, expect } from "vitest";
import { reconcileDraft, type StoredDraft } from "./reconcileDraft";

const mk = (v: number, t: string): StoredDraft<number> => ({ value: v, updatedAt: t });

test("returns server when there is no local draft", () => {
  const s = mk(2, "2026-06-25T10:00:00Z");
  expect(reconcileDraft<number>(null, s)).toBe(s);
});

test("returns local when there is no server draft", () => {
  const l = mk(1, "2026-06-25T10:00:00Z");
  expect(reconcileDraft<number>(l, null)).toBe(l);
});

test("returns null when neither exists", () => {
  expect(reconcileDraft<number>(null, null)).toBeNull();
});

test("newest updated_at wins (server newer)", () => {
  const l = mk(1, "2026-06-25T10:00:00Z");
  const s = mk(2, "2026-06-25T10:05:00Z");
  expect(reconcileDraft(l, s)).toBe(s);
});

test("newest updated_at wins (local newer)", () => {
  const l = mk(1, "2026-06-25T10:05:00Z");
  const s = mk(2, "2026-06-25T10:00:00Z");
  expect(reconcileDraft(l, s)).toBe(l);
});

test("ties favor the server (cross-device source of truth)", () => {
  const t = "2026-06-25T10:00:00Z";
  const l = mk(1, t);
  const s = mk(2, t);
  expect(reconcileDraft(l, s)).toBe(s);
});

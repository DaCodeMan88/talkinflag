import { describe, it, expect } from "vitest";
import { completionRate, dropOffHistogram, isAbandoned } from "./session";

describe("completionRate", () => {
  it("is completed/started as a 0-100 percentage", () => {
    expect(completionRate([{ completed_at: "x" }, { completed_at: null }, { completed_at: "y" }])).toBe(66.7);
  });
  it("is 0 when nothing has started", () => {
    expect(completionRate([])).toBe(0);
  });
});

describe("dropOffHistogram", () => {
  it("buckets unfinished sessions by their furthest question", () => {
    const h = dropOffHistogram(
      [
        { completed_at: null, last_index: 0 },
        { completed_at: null, last_index: 3 },
        { completed_at: null, last_index: 3 },
        { completed_at: "done", last_index: 27 },
      ],
      28
    );
    expect(h[0]).toBe(1);
    expect(h[3]).toBe(2);
    expect(h[27]).toBe(0);
    expect(h).toHaveLength(28);
  });
});

describe("isAbandoned", () => {
  const now = new Date("2026-08-01T12:00:00Z");
  it("is true for an unfinished session idle over 30 minutes with real progress", () => {
    expect(isAbandoned({ completed_at: null, answered_count: 6, last_seen_at: "2026-08-01T11:00:00Z" }, now)).toBe(true);
  });
  it("is false while the session is still warm", () => {
    expect(isAbandoned({ completed_at: null, answered_count: 6, last_seen_at: "2026-08-01T11:50:00Z" }, now)).toBe(false);
  });
  it("is false when they never really started", () => {
    expect(isAbandoned({ completed_at: null, answered_count: 0, last_seen_at: "2026-08-01T11:00:00Z" }, now)).toBe(false);
  });
  it("is false once completed", () => {
    expect(isAbandoned({ completed_at: "x", answered_count: 28, last_seen_at: "2026-08-01T11:00:00Z" }, now)).toBe(false);
  });
});

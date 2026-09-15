import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { daysSinceLastCuration, STALE_AFTER_DAYS } from "./staleness";

const NOW = new Date("2026-09-14T12:00:00Z");
/** A DATE-column value (bare YYYY-MM-DD, UTC) n days before NOW. */
const dateAgo = (n: number) =>
  new Date(NOW.getTime() - n * 86_400_000).toISOString().slice(0, 10);

describe("daysSinceLastCuration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  /**
   * The column is a Postgres DATE, so the value arrives as a bare "YYYY-MM-DD"
   * with no time and no zone — and `capturedOn` writes it from the UTC date.
   * Both halves must agree on UTC or the reading is off by a day.
   */
  it("reads a bare YYYY-MM-DD date as UTC midnight", () => {
    expect(daysSinceLastCuration([{ metrics_captured_on: "2026-09-14" }])).toBe(0);
    expect(daysSinceLastCuration([{ metrics_captured_on: "2026-09-13" }])).toBe(1);
    expect(daysSinceLastCuration([{ metrics_captured_on: "2026-08-14" }])).toBe(31);
  });

  it("is null when there are no rows at all", () => {
    expect(daysSinceLastCuration([])).toBeNull();
  });

  /**
   * The state the seeded table is in: nine reels, no numbers ever read off
   * Insights. "Never curated" is not "curated today".
   */
  it("is null when no row carries a capture date", () => {
    expect(
      daysSinceLastCuration([
        { metrics_captured_on: null },
        { metrics_captured_on: undefined },
        {},
      ])
    ).toBeNull();
  });

  it("ignores a value that isn't a date", () => {
    expect(daysSinceLastCuration([{ metrics_captured_on: "last Tuesday" }])).toBeNull();
  });

  it("reads the MOST RECENT capture, not the oldest", () => {
    expect(
      daysSinceLastCuration([
        { metrics_captured_on: dateAgo(90) },
        { metrics_captured_on: dateAgo(3) },
        { metrics_captured_on: dateAgo(40) },
      ])
    ).toBe(3);
  });

  it("falls back to the readable rows when some are unusable", () => {
    expect(
      daysSinceLastCuration([
        { metrics_captured_on: null },
        { metrics_captured_on: dateAgo(12) },
      ])
    ).toBe(12);
  });

  it("floors a partial day rather than rounding it up", () => {
    // Stamped yesterday (UTC midnight), now 12:00 today — 1 day, never 2.
    expect(daysSinceLastCuration([{ metrics_captured_on: dateAgo(1) }])).toBe(1);
  });

  /**
   * A date stamped in the future (clock skew between the DB and the app server)
   * must not render as "-1 days ago". Clamping to 0 says "just curated", which
   * is the honest reading of a stamp newer than now.
   */
  it("clamps a future date to zero instead of going negative", () => {
    expect(daysSinceLastCuration([{ metrics_captured_on: dateAgo(-2) }])).toBe(0);
  });

  /**
   * The guard that makes this column the right one: `updated_at` is stamped on
   * every live row by a reorder and by a note-only edit, so reading it would let
   * nudging a reel up a slot silence the nag without a number being read.
   */
  it("does not read updated_at", () => {
    const rows = [{ metrics_captured_on: null, updated_at: new Date().toISOString() }];
    expect(daysSinceLastCuration(rows)).toBeNull();
  });

  it("nags only past the threshold", () => {
    expect(STALE_AFTER_DAYS).toBe(35);
    expect(
      daysSinceLastCuration([{ metrics_captured_on: dateAgo(36) }])
    ).toBeGreaterThan(STALE_AFTER_DAYS);
    expect(daysSinceLastCuration([{ metrics_captured_on: dateAgo(35) }])).toBe(
      STALE_AFTER_DAYS
    );
  });
});

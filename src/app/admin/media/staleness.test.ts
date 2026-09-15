import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { daysSinceLastCuration, STALE_AFTER_DAYS } from "./staleness";

const NOW = new Date("2026-09-14T12:00:00Z");
const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 86_400_000).toISOString();

describe("daysSinceLastCuration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("is null when there are no rows at all", () => {
    expect(daysSinceLastCuration([])).toBeNull();
  });

  it("is null when no row carries a usable timestamp", () => {
    expect(
      daysSinceLastCuration([{ updated_at: null }, { updated_at: undefined }, {}])
    ).toBeNull();
  });

  it("ignores a timestamp that isn't a date", () => {
    expect(daysSinceLastCuration([{ updated_at: "last Tuesday" }])).toBeNull();
  });

  it("reads the MOST RECENT edit, not the oldest", () => {
    expect(
      daysSinceLastCuration([
        { updated_at: daysAgo(90) },
        { updated_at: daysAgo(3) },
        { updated_at: daysAgo(40) },
      ])
    ).toBe(3);
  });

  it("falls back to the readable rows when some are unusable", () => {
    expect(
      daysSinceLastCuration([{ updated_at: null }, { updated_at: daysAgo(12) }])
    ).toBe(12);
  });

  it("floors a partial day rather than rounding it up", () => {
    // 5 days and 23 hours ago is still "5 days ago", never "6".
    const t = new Date(NOW.getTime() - (5 * 86_400_000 + 23 * 3_600_000));
    expect(daysSinceLastCuration([{ updated_at: t.toISOString() }])).toBe(5);
  });

  it("reads an edit made moments ago as zero days", () => {
    expect(daysSinceLastCuration([{ updated_at: NOW.toISOString() }])).toBe(0);
  });

  /**
   * A row stamped in the future (clock skew between the DB and the app server)
   * must not render as "-1 days ago". Clamping to 0 says "just curated", which
   * is the honest reading of a stamp newer than now.
   */
  it("clamps a future timestamp to zero instead of going negative", () => {
    expect(daysSinceLastCuration([{ updated_at: daysAgo(-2) }])).toBe(0);
  });

  it("nags only past the threshold", () => {
    expect(STALE_AFTER_DAYS).toBe(35);
    expect(daysSinceLastCuration([{ updated_at: daysAgo(36) }])).toBeGreaterThan(
      STALE_AFTER_DAYS
    );
    expect(daysSinceLastCuration([{ updated_at: daysAgo(35) }])).toBe(
      STALE_AFTER_DAYS
    );
  });
});

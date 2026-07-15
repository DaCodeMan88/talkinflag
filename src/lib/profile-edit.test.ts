import { describe, it, expect } from "vitest";
import {
  EDITABLE_STATS_KEYS,
  sanitizeStatsPayload,
  shouldResetVerification,
} from "./profile-edit";
import { sanitizeIdentityPayload } from "./profile-edit";

describe("EDITABLE_STATS_KEYS", () => {
  it("contains exactly the editable stats keys", () => {
    expect([...EDITABLE_STATS_KEYS].sort()).toEqual(
      [
        "achievements",
        "caps",
        "club",
        "education",
        "forty_yard",
        "jersey",
        "nickname",
        "occupation",
        "tournaments",
        "vertical_jump",
        "wingspan_in",
        "world_appearances",
        "years_active",
      ].sort()
    );
  });

  it("never allows internal keys", () => {
    for (const k of ["team_designation", "source", "seed_batch", "roster_year"]) {
      expect(EDITABLE_STATS_KEYS).not.toContain(k);
    }
  });
});

describe("sanitizeStatsPayload", () => {
  it("strips non-allowlisted keys entirely", () => {
    const out = sanitizeStatsPayload({
      team_designation: "national_senior",
      source: "hacker",
      seed_batch: "x",
      roster_year: "2024",
      caps: 10,
    });
    expect(Object.keys(out)).toEqual(["caps"]);
    expect(out.caps).toBe(10);
  });

  it("only includes keys present in the body", () => {
    expect(sanitizeStatsPayload({})).toEqual({});
    expect(Object.keys(sanitizeStatsPayload({ club: "Roma" }))).toEqual(["club"]);
  });

  it("sanitizes numeric fields with ranges (out of range -> null)", () => {
    expect(sanitizeStatsPayload({ caps: "25" }).caps).toBe(25);
    expect(sanitizeStatsPayload({ caps: -1 }).caps).toBeNull();
    expect(sanitizeStatsPayload({ caps: 2000 }).caps).toBeNull();
    expect(sanitizeStatsPayload({ world_appearances: 3 }).world_appearances).toBe(3);
    expect(sanitizeStatsPayload({ world_appearances: 99 }).world_appearances).toBeNull();
    expect(sanitizeStatsPayload({ years_active: 12 }).years_active).toBe(12);
    expect(sanitizeStatsPayload({ years_active: 55 }).years_active).toBeNull();
    expect(sanitizeStatsPayload({ wingspan_in: 70 }).wingspan_in).toBe(70);
    expect(sanitizeStatsPayload({ wingspan_in: 20 }).wingspan_in).toBeNull();
    expect(sanitizeStatsPayload({ vertical_jump: 30 }).vertical_jump).toBe(30);
    expect(sanitizeStatsPayload({ vertical_jump: 100 }).vertical_jump).toBeNull();
  });

  it("formats forty_yard to 2 decimals within range", () => {
    expect(sanitizeStatsPayload({ forty_yard: "4.6" }).forty_yard).toBe("4.60");
    expect(sanitizeStatsPayload({ forty_yard: "2" }).forty_yard).toBeNull();
    expect(sanitizeStatsPayload({ forty_yard: "abc" }).forty_yard).toBeNull();
  });

  it("caps string fields and maps blank to null", () => {
    expect(sanitizeStatsPayload({ nickname: "  The Jet  " }).nickname).toBe("The Jet");
    expect(sanitizeStatsPayload({ nickname: "" }).nickname).toBeNull();
    expect(
      (sanitizeStatsPayload({ club: "x".repeat(300) }).club as string).length
    ).toBe(120);
    expect(
      (sanitizeStatsPayload({ jersey: "1234567890123" }).jersey as string).length
    ).toBe(10);
    expect(
      (sanitizeStatsPayload({ occupation: "y".repeat(300) }).occupation as string).length
    ).toBe(100);
    expect(
      (sanitizeStatsPayload({ education: "y".repeat(300) }).education as string).length
    ).toBe(100);
  });

  it("achievements: array of trimmed strings, capped at 20 x 160 chars, non-array -> null", () => {
    const out = sanitizeStatsPayload({
      achievements: ["  Gold 2024  ", "", 42, "b".repeat(500)],
    });
    expect(out.achievements).toEqual(["Gold 2024", "b".repeat(160)]);

    const many = sanitizeStatsPayload({
      achievements: Array.from({ length: 30 }, (_, i) => `a${i}`),
    });
    expect((many.achievements as string[]).length).toBe(20);

    expect(sanitizeStatsPayload({ achievements: "not-an-array" }).achievements).toBeNull();
    expect(sanitizeStatsPayload({ achievements: [] }).achievements).toBeNull();
  });

  it("tournaments: only {year,event,result,location}, capped at 30 rows", () => {
    const out = sanitizeStatsPayload({
      tournaments: [
        { year: "2024", event: "Worlds", result: "Gold", location: "Lahti", extra: "nope" },
        { year: 1980, event: "Too old" }, // invalid year dropped, row kept
        { event: "" }, // empty row dropped
        "garbage",
        { event: "e".repeat(300), result: "Silver" },
      ],
    });
    const rows = out.tournaments as Record<string, unknown>[];
    expect(rows).toEqual([
      { year: 2024, event: "Worlds", result: "Gold", location: "Lahti" },
      { event: "Too old" },
      { event: "e".repeat(120), result: "Silver" },
    ]);
    expect(rows[0]).not.toHaveProperty("extra");

    const many = sanitizeStatsPayload({
      tournaments: Array.from({ length: 40 }, (_, i) => ({ event: `E${i}` })),
    });
    expect((many.tournaments as unknown[]).length).toBe(30);

    expect(sanitizeStatsPayload({ tournaments: "x" }).tournaments).toBeNull();
    expect(sanitizeStatsPayload({ tournaments: [] }).tournaments).toBeNull();
  });

  it("rejects tournament years outside 1990-2035", () => {
    const out = sanitizeStatsPayload({
      tournaments: [{ year: 2036, event: "Future" }, { year: 1995, event: "Ok" }],
    });
    expect(out.tournaments).toEqual([{ event: "Future" }, { year: 1995, event: "Ok" }]);
  });
});

describe("shouldResetVerification", () => {
  const existing = {
    caps: 25,
    world_appearances: 2,
    achievements: ["Gold 2024"],
    tournaments: [{ year: 2024, event: "Worlds", result: "Gold", location: "Lahti" }],
    nickname: "Jet",
  };

  it("false when no sensitive keys are in the payload", () => {
    expect(shouldResetVerification(existing, { nickname: "New Jet", club: "Roma" })).toBe(false);
  });

  it("false when sensitive keys are sent unchanged", () => {
    expect(
      shouldResetVerification(existing, {
        caps: 25,
        world_appearances: 2,
        achievements: ["Gold 2024"],
        tournaments: [{ year: 2024, event: "Worlds", result: "Gold", location: "Lahti" }],
      })
    ).toBe(false);
  });

  it("ignores field ordering inside tournament rows", () => {
    expect(
      shouldResetVerification(existing, {
        tournaments: [{ location: "Lahti", result: "Gold", event: "Worlds", year: 2024 }],
      })
    ).toBe(false);
  });

  it("true when caps changes", () => {
    expect(shouldResetVerification(existing, { caps: 30 })).toBe(true);
  });

  it("true when world_appearances changes", () => {
    expect(shouldResetVerification(existing, { world_appearances: 3 })).toBe(true);
  });

  it("true when achievements change", () => {
    expect(shouldResetVerification(existing, { achievements: ["Gold 2024", "MVP"] })).toBe(true);
  });

  it("true when tournaments change", () => {
    expect(
      shouldResetVerification(existing, {
        tournaments: [{ year: 2025, event: "Worlds", result: "Silver" }],
      })
    ).toBe(true);
  });

  it("true when a sensitive value is removed (blanked)", () => {
    expect(shouldResetVerification(existing, { caps: null })).toBe(true);
    expect(shouldResetVerification(existing, { achievements: null })).toBe(true);
  });

  it("treats legacy string numbers as equal to numeric payloads", () => {
    const legacy = {
      caps: "25",
      tournaments: [{ year: "2024", event: "Worlds", result: "Gold", location: "Lahti" }],
    };
    expect(shouldResetVerification(legacy, { caps: 25 })).toBe(false);
    expect(
      shouldResetVerification(legacy, {
        tournaments: [{ year: 2024, event: "Worlds", result: "Gold", location: "Lahti" }],
      })
    ).toBe(false);
  });

  it("false when a sensitive key was absent and stays absent", () => {
    expect(shouldResetVerification({}, { caps: null, achievements: null, tournaments: null })).toBe(
      false
    );
  });
});

describe("sanitizeIdentityPayload (soft fields)", () => {
  it("accepts a valid position and passes it through", () => {
    expect(sanitizeIdentityPayload({ position: "WR" })).toEqual({ position: "WR" });
  });
  it("rejects an out-of-allowlist position → null (clears)", () => {
    expect(sanitizeIdentityPayload({ position: "Kicker" })).toEqual({ position: null });
  });
  it("caps and trims city/country", () => {
    expect(sanitizeIdentityPayload({ city: "  Rome  ", country: "Italy" }))
      .toEqual({ city: "Rome", country: "Italy" });
  });
  it("only returns keys present in the body (PATCH semantics)", () => {
    expect(sanitizeIdentityPayload({ city: "Rome" })).toEqual({ city: "Rome" });
  });
  it("never returns name/team/level even if sent (guarded fields are stripped)", () => {
    const out = sanitizeIdentityPayload({ first_name: "X", last_name: "Y", school_or_team: "Z", level: "pro" });
    expect(out).toEqual({});
  });
});

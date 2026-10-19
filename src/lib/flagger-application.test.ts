import { test, expect } from "vitest";
import { validateFlaggerApplication, formatApplication } from "./flagger-application";

const NOW = 1_800_000_000_000;
const good = () => ({
  track: "flagger",
  name: "A Tester",
  email: "T@Example.com",
  school: "",
  year: "",
  location: "Seattle, WA",
  availability: "2 games a month",
  equipment: "iPhone 15, gimbal",
  experience: "shoots for the student paper",
  age_band: "18plus",
  athlete: "no",
  international: "no",
  role_interest: "Regional",
  links: "https://instagram.com/x",
  rendered_at: NOW - 30_000,
  website: "",
});
const run = (o: Record<string, unknown> = {}) => validateFlaggerApplication({ ...good(), ...o }, NOW);

test("a clean adult non-athlete lands as new, email lowercased", () => {
  const r = run();
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.row.status).toBe("new");
    expect(r.row.email).toBe("t@example.com");
  }
});

test("bots are dropped silently: honeypot, too fast, no render stamp", () => {
  expect(run({ website: "http://spam" })).toMatchObject({ ok: false, drop: true });
  expect(run({ rendered_at: NOW - 500 })).toMatchObject({ ok: false, drop: true });
  expect(run({ rendered_at: undefined })).toMatchObject({ ok: false, drop: true });
});

test("invalid fields are named", () => {
  const r = run({ email: "nope", track: "boss", location: "" });
  expect(r.ok).toBe(false);
  if (!r.ok && !r.drop) expect(r.errors).toEqual(expect.arrayContaining(["email", "track", "location"]));
});

test("a current college athlete is held for the NIL check, never accepted outright", () => {
  const r = run({ athlete: "yes" });
  expect(r.ok && r.row.status).toBe("needs_nil_check");
});

test("a minor is held for guardian consent, and consent comes before the NIL check", () => {
  expect(run({ age_band: "under18" }).ok && run({ age_band: "under18" })).toMatchObject({ row: { status: "needs_guardian_consent" } });
  expect(run({ age_band: "under18", athlete: "yes" })).toMatchObject({ row: { status: "needs_guardian_consent" } });
});

test("an international intern is held for CPT; interns must name a school", () => {
  expect(run({ track: "intern", international: "yes", school: "Seattle U" })).toMatchObject({ row: { status: "needs_cpt" } });
  const r = run({ track: "intern", school: "" });
  expect(r.ok).toBe(false);
  if (!r.ok && !r.drop) expect(r.errors).toContain("school");
});

test("control characters are stripped and unknown fields are dropped", () => {
  const r = run({ name: "A\u0007B", phone: "555" });
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.row.name).toBe("AB");
    expect("phone" in r.row).toBe(false);
  }
});

test("the stored message carries every field and the computed status", () => {
  const r = run({ athlete: "yes" });
  if (!r.ok) throw new Error("expected ok");
  const msg = formatApplication(r.row);
  expect(msg).toContain("status: needs_nil_check");
  expect(msg).toContain("location: Seattle, WA");
  expect(msg).toContain("equipment: iPhone 15, gimbal");
});

import { test, expect } from "vitest";
import { isActiveRosterPlayer } from "./world-rankings";

test("players with no roster_status count as active", () => {
  expect(isActiveRosterPlayer({})).toBe(true);
  expect(isActiveRosterPlayer({ team_designation: "national_senior" })).toBe(true);
  expect(isActiveRosterPlayer(null)).toBe(true);
  expect(isActiveRosterPlayer(undefined)).toBe(true);
  expect(isActiveRosterPlayer("not-an-object")).toBe(true);
});

test("roster_status 'inactive' and 'former' are excluded", () => {
  expect(isActiveRosterPlayer({ roster_status: "inactive" })).toBe(false);
  expect(isActiveRosterPlayer({ roster_status: "former" })).toBe(false);
});

test("status matching is case- and whitespace-insensitive", () => {
  expect(isActiveRosterPlayer({ roster_status: " Former " })).toBe(false);
  expect(isActiveRosterPlayer({ roster_status: "INACTIVE" })).toBe(false);
});

test("other statuses stay active", () => {
  expect(isActiveRosterPlayer({ roster_status: "active" })).toBe(true);
  expect(isActiveRosterPlayer({ roster_status: "" })).toBe(true);
});

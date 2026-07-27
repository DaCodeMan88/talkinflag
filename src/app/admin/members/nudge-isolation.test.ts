import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Guard: the nudge server action must only touch profile_nudges + auth,
// never the players table. See docs/plans/2026-07-27-player-review-workflow-and-lifecycle-emails.md
// (Analysis: the "nudge auto-approves" report was a labeling trap, not a state change).
describe("sendNudge isolation", () => {
  const src = readFileSync(join(__dirname, "actions.ts"), "utf8");
  const sendNudge = src.slice(src.indexOf("export async function sendNudge"));

  it("does not write to the players table", () => {
    expect(sendNudge).not.toMatch(/from\(["']players["']\)/);
    expect(sendNudge).not.toMatch(/is_approved/);
    expect(sendNudge).not.toMatch(/claim_pending/);
  });
});

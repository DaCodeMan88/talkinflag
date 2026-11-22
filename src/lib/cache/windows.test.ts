import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Guard for the Vercel free-tier fix (Nov 2026): public pages keep their saved
// copy for a day, and the routes that change public data refresh pages directly.
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

const APP = join(__dirname, "../../app");
const ALLOWED_SHORT = new Set(["players/compare/page.tsx"]); // URL params drive it

describe("page refresh windows", () => {
  it("no public page rebuilds more often than once a day", () => {
    const short: string[] = [];
    for (const f of files(APP)) {
      const m = readFileSync(f, "utf8").match(/export const revalidate = (\d+)/);
      const rel = f.slice(APP.length + 1);
      if (m && Number(m[1]) < 86400 && !ALLOWED_SHORT.has(rel)) short.push(`${rel} (${m[1]}s)`);
    }
    expect(short).toEqual([]);
  });

  it("routes that change public player, coach or event data refresh the pages", () => {
    const writers = [
      "api/players/[id]/photo/route.ts",
      "api/players/[id]/recruiting/route.ts",
      "api/players/[id]/profile/route.ts",
      "api/players/[id]/interest/route.ts",
      "api/admin/verifications/[id]/route.ts",
      "api/admin/career-updates/[id]/route.ts",
      "api/admin/recompute-rankings/route.ts",
      "api/admin/coaches/route.ts",
      "api/coaches/update/route.ts",
      "api/coaches/spots/route.ts",
      "api/events/approve/route.ts",
    ];
    const missing = writers.filter((w) => !/from "@\/lib\/cache\/refresh"/.test(readFileSync(join(APP, w), "utf8")));
    expect(missing).toEqual([]);
  });
});

#!/usr/bin/env npx tsx
/**
 * Seed top-3 national flag-football rosters from scripts/data/national-rosters-2024.json.
 *
 * Adds the men's/women's national-team rosters for the top-3 IFAF nations not yet in
 * the DB (Mexico W/M, Great Britain W, Austria M). USA + Italy are already seeded and
 * are protected by the dedup guard below.
 *
 * Usage:
 *   npx tsx scripts/seed-national-rosters.ts --dry-run     # logs the insert/skip plan, NO writes
 *   DRY_RUN=1 npx tsx scripts/seed-national-rosters.ts     # same, via env
 *   npx tsx scripts/seed-national-rosters.ts               # LIVE insert (controller only)
 *
 * Idempotent: before inserting a player it checks for an existing national-level row
 * matching (first_name, last_name, country, gender) and SKIPs if found, so re-runs and
 * the existing USA/Italy rows are never duplicated.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) { console.error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"); process.exit(1); }
const db = createClient(url, key);

const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";
const SEED_BATCH = "2026-06-24-top3";

// Must match the players.position CHECK constraint exactly.
const ALLOWED_POSITIONS = new Set(["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"]);
const ALLOWED_GENDERS = new Set(["female", "male"]);

type Player = {
  first_name: string;
  last_name: string;
  position: string;
  jersey?: string;
  club?: string;
};
type Roster = {
  country: string;
  gender: string;
  roster_year: string;
  team_designation: string;
  source: string;
  head_coach?: string;
  key_players?: string[];
  _note?: string;
  players: Player[];
};

function validate(rosters: Roster[]) {
  const errors: string[] = [];
  for (const r of rosters) {
    if (!r.country) errors.push(`Roster missing country: ${JSON.stringify(r).slice(0, 80)}`);
    if (!ALLOWED_GENDERS.has(r.gender)) errors.push(`Invalid gender "${r.gender}" for ${r.country}`);
    if (!r.roster_year) errors.push(`Missing roster_year for ${r.country} ${r.gender}`);
    if (!r.team_designation) errors.push(`Missing team_designation for ${r.country} ${r.gender}`);
    if (!r.source) errors.push(`Missing source for ${r.country} ${r.gender}`);
    for (const p of r.players ?? []) {
      if (!p.first_name || !p.last_name) {
        errors.push(`Player missing name in ${r.country} ${r.gender}: ${JSON.stringify(p)}`);
      }
      if (!ALLOWED_POSITIONS.has(p.position)) {
        errors.push(
          `Invalid position "${p.position}" for ${p.first_name} ${p.last_name} (${r.country} ${r.gender}). ` +
            `Allowed: ${[...ALLOWED_POSITIONS].join(", ")}`,
        );
      }
    }
  }
  if (errors.length) {
    throw new Error(`Validation failed (${errors.length}):\n  - ${errors.join("\n  - ")}`);
  }
}

async function existsAlready(p: Player, country: string, gender: string): Promise<boolean> {
  const { data, error } = await db
    .from("players")
    .select("id")
    .eq("first_name", p.first_name)
    .eq("last_name", p.last_name)
    .eq("country", country)
    .eq("gender", gender)
    .eq("level", "national")
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

async function main() {
  const data = JSON.parse(
    readFileSync(join("scripts", "data", "national-rosters-2024.json"), "utf8"),
  ) as { rosters: Roster[] };
  const rosters = data.rosters ?? [];

  console.log(`\n${DRY_RUN ? "🟡 DRY RUN" : "🔴 LIVE"} — seed-national-rosters (batch ${SEED_BATCH})`);
  console.log(`Loaded ${rosters.length} rosters.\n`);

  // Validate EVERY player's position before any DB work.
  validate(rosters);
  console.log("✓ Validation passed: all positions/genders/required fields valid.\n");

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const r of rosters) {
    let inserted = 0;
    let skipped = 0;
    const rows: Record<string, unknown>[] = [];

    for (const p of r.players) {
      if (await existsAlready(p, r.country, r.gender)) {
        skipped++;
        if (DRY_RUN) console.log(`   ⏭️  skip (exists): ${p.first_name} ${p.last_name}`);
        continue;
      }
      const stats: Record<string, unknown> = {
        team_designation: r.team_designation,
        roster_year: r.roster_year,
        source: r.source,
        seed_batch: SEED_BATCH,
      };
      if (p.jersey) stats.jersey = p.jersey;
      if (p.club) stats.club = p.club;

      rows.push({
        first_name: p.first_name,
        last_name: p.last_name,
        position: p.position,
        gender: r.gender,
        country: r.country,
        level: "national",
        is_verified: false,
        is_claimed: false,
        stats,
      });
      inserted++;
      if (DRY_RUN) console.log(`   ➕ would insert: ${p.first_name} ${p.last_name} (${p.position})`);
    }

    if (!DRY_RUN && rows.length) {
      const { error } = await db.from("players").insert(rows);
      if (error) throw error;
    }

    console.log(
      `${r.country} ${r.gender}: ${inserted} ${DRY_RUN ? "would insert" : "inserted"}, ${skipped} skipped (of ${r.players.length}).`,
    );
    totalInserted += inserted;
    totalSkipped += skipped;
  }

  console.log(
    `\n── Summary (${DRY_RUN ? "DRY RUN — no writes" : "LIVE"}): ${totalInserted} ${DRY_RUN ? "to insert" : "inserted"}, ${totalSkipped} skipped across ${rosters.length} rosters. ──\n`,
  );
}

main().catch((e) => { console.error(e); process.exit(1); });

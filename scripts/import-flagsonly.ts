#!/usr/bin/env npx tsx
/**
 * Import flagsonly.com player index as unclaimed reference profiles.
 * Usage:
 *   npx tsx scripts/import-flagsonly.ts --dry-run   (print counts, no DB writes)
 *   npx tsx scripts/import-flagsonly.ts              (insert new players)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const DRY_RUN = process.argv.includes("--dry-run");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FlagsonlyPlayer {
  first_name: string;
  last_name: string;
  position: string;
  school_or_team: string;
  year: string;
  state: string;
  level: "college" | "national";
}

const VALID_POSITIONS = new Set(["QB", "WR", "DB", "LB", "C", "Rusher", "Utility"]);

function normalizePosition(pos: string): string {
  if (VALID_POSITIONS.has(pos)) return pos;
  if (pos.toLowerCase().includes("center")) return "C";
  if (pos.toLowerCase().includes("rusher")) return "Rusher";
  if (pos.toLowerCase().includes("qb")) return "QB";
  if (pos.toLowerCase().includes("wr")) return "WR";
  if (pos.toLowerCase().includes("db")) return "DB";
  return "Utility";
}

function normalizeCountry(state: string): string {
  const stateMap: Record<string, string> = {
    "Panama": "Panama",
    "Canada": "Canada",
    "United Kingdom": "United Kingdom",
    "Quebec": "Canada",
    "USVI": "United States",
    "Mexico": "Mexico",
  };
  if (stateMap[state]) return stateMap[state];
  // US states are 2-letter abbreviations or full names
  return "United States";
}

function normalizeState(state: string): string | null {
  const usStates = new Set([
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
    "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
    "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
    "VA","WA","WV","WI","WY","DC",
  ]);
  if (usStates.has(state)) return state;
  return null; // international
}

async function main() {
  const raw = readFileSync(join(__dirname, "data/flagsonly-players.json"), "utf8");
  const players: FlagsonlyPlayer[] = JSON.parse(raw);

  console.log(`Loaded ${players.length} players from flagsonly-players.json`);

  // Fetch existing players for dedup check
  const { data: existing, error: fetchErr } = await supabase
    .from("players")
    .select("first_name, last_name, school_or_team");

  if (fetchErr) throw fetchErr;

  const existingSet = new Set(
    (existing ?? []).map((p) =>
      `${p.first_name.toLowerCase()}|${p.last_name.toLowerCase()}|${(p.school_or_team ?? "").toLowerCase()}`
    )
  );

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of players) {
    const key = `${p.first_name.toLowerCase()}|${p.last_name.toLowerCase()}|${p.school_or_team.toLowerCase()}`;

    if (existingSet.has(key)) {
      skipped++;
      continue;
    }

    // Also skip if name alone matches (same person, different team spelling)
    const nameKey = `${p.first_name.toLowerCase()}|${p.last_name.toLowerCase()}`;
    const nameExists = (existing ?? []).some(
      (e) =>
        e.first_name.toLowerCase() === p.first_name.toLowerCase() &&
        e.last_name.toLowerCase() === p.last_name.toLowerCase()
    );
    if (nameExists) {
      skipped++;
      continue;
    }

    const country = normalizeCountry(p.state);
    const stateCode = normalizeState(p.state);

    const row = {
      first_name: p.first_name,
      last_name: p.last_name,
      position: normalizePosition(p.position || "Utility"),
      level: p.level,
      school_or_team: p.school_or_team,
      state: stateCode,
      country,
      gender: "female" as const, // flagsonly indexes predominantly women's flag football
      is_verified: false,
      is_claimed: false,
      stats: {
        source: "flagsonly",
        imported_at: new Date().toISOString(),
        year_in_school: p.year === "—" ? null : p.year,
      },
    };

    if (DRY_RUN) {
      inserted++;
      continue;
    }

    const { error } = await supabase.from("players").insert(row);
    if (error) {
      console.error(`Error inserting ${p.first_name} ${p.last_name}:`, error.message);
      errors++;
    } else {
      inserted++;
    }
  }

  console.log(`\nResult (${DRY_RUN ? "DRY RUN" : "LIVE"}):`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (duplicates): ${skipped}`);
  if (!DRY_RUN) console.log(`  Errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

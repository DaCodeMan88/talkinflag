#!/usr/bin/env npx tsx
/**
 * Build the league-adjusted KNN profile_vector for every player.
 * Re-run whenever stats/verification change. Usage: npx tsx scripts/build-player-vectors.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { buildPlayerVector, offenseRaw, defenseRaw, bigGameRaw, Stats } from "../src/lib/knn/profile";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type Player = { id: string; position: string | null; gender: string | null; level: string | null; country_code: string | null; stats: Stats };

function leagueKey(p: Player): string {
  if (p.level === "national") return p.country_code === "US" ? "usa_national" : "intl_national";
  if (p.level === "college") return "us_college";
  if (p.level === "high_school") return "us_hs";
  return "other";
}

async function main() {
  const { data: diffs } = await db.from("league_difficulty").select("league_key, difficulty");
  const diffMap = new Map((diffs ?? []).map((d) => [d.league_key, Number(d.difficulty)]));

  const { data: players, error } = await db
    .from("players")
    .select("id, position, gender, level, country_code, stats");
  if (error) throw error;
  const rows = (players ?? []) as Player[];

  // League-wide maxima of ADJUSTED production composites (raw × difficulty).
  let mOff = 0, mDef = 0, mBig = 0;
  for (const p of rows) {
    const d = diffMap.get(leagueKey(p)) ?? 0.8;
    mOff = Math.max(mOff, offenseRaw(p.stats) * d);
    mDef = Math.max(mDef, defenseRaw(p.stats) * d);
    mBig = Math.max(mBig, bigGameRaw(p.stats) * d);
  }
  const maxes = { offense: mOff || 1, defense: mDef || 1, bigGame: mBig || 1 };
  console.log("adjusted maxima:", maxes);

  const now = new Date().toISOString();
  let done = 0;
  for (const p of rows) {
    const lk = leagueKey(p);
    const d = diffMap.get(lk) ?? 0.8;
    const v = buildPlayerVector(p, d, maxes);
    const { error: upErr } = await db
      .from("players")
      .update({ league_key: lk, profile_vector: `[${v.join(",")}]`, profile_built_at: now })
      .eq("id", p.id);
    if (upErr) { console.error("update failed", p.id, upErr.message); continue; }
    if (++done % 50 === 0) console.log(`  ${done}/${rows.length}`);
  }
  console.log(`✓ built vectors for ${done}/${rows.length} players`);
}

main().catch((e) => { console.error(e); process.exit(1); });

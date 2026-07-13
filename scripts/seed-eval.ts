#!/usr/bin/env npx tsx
/**
 * Seed the Athlete Evaluation Philosophy questionnaire:
 *   - 10 eval_dimensions (+ science map)
 *   - active eval_questionnaires v1
 *   - 50 eval_items (from scripts/data/eval-items.json — 5 per dimension)
 *   - eval_reference: taxonomy tier-derived "elite ideal" vector (dim.* + sci.*)
 *
 * Usage: npx tsx --env-file=.env.local scripts/seed-eval.ts
 *   (or it will read .env.local itself if --env-file is unsupported)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// --- load env (self-contained so it runs with plain tsx) ---
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) { console.error("Missing Supabase env"); process.exit(1); }
const db = createClient(url, key);

const DIMENSIONS = [
  { key: "athleticism", ordinal: 1, name: "Athleticism & Explosiveness", science_dimension: "S5", description: "Speed, acceleration, change-of-direction, vertical." },
  { key: "football_iq", ordinal: 2, name: "Football IQ & Decision-Making", science_dimension: "S1", description: "Reads, anticipation, situational awareness." },
  { key: "ball_skills", ordinal: 3, name: "Ball Skills & Visuomotor", science_dimension: "S2", description: "Catching/hands; QB accuracy & touch; ball-tracking." },
  { key: "defense", ordinal: 4, name: "Flag-Pulling & Defensive Technique", science_dimension: "S2", description: "Pursuit angles, deflag rate, coverage, discipline." },
  { key: "production", ordinal: 5, name: "Production & Physical Tools", science_dimension: null, description: "Raw output and the physical tools that drive it." },
  { key: "competition", ordinal: 6, name: "Competition Level", science_dimension: null, description: "Strength of schedule — who they did it against." },
  { key: "clutch", ordinal: 7, name: "Clutch & Big-Game", science_dimension: "S3", description: "Coping under pressure, postseason, late-game." },
  { key: "versatility", ordinal: 8, name: "Versatility", science_dimension: "S1", description: "Multi-position, cognitive flexibility, two-way play." },
  { key: "intangibles", ordinal: 9, name: "Intangibles & Leadership", science_dimension: "S3", description: "Coachability, mental toughness, captaincy, Mamba mentality." },
  { key: "consistency", ordinal: 10, name: "Consistency & Durability", science_dimension: "S6", description: "Year-over-year, availability, recovery." },
];

type Item = {
  ordinal: number; section_key: string; prompt: string;
  options: { label: string; dimension: string; points: number }[];
  style: string; science_dimension: string; taxonomy_trait_id: number;
  taxonomy_tier: number; source_citation: string;
};

function round3(n: number) { return Math.round(n * 1000) / 1000; }

async function main() {
  const data = JSON.parse(readFileSync(join("scripts", "data", "eval-items.json"), "utf8"));
  const items: Item[] = data.items;
  if (items.length !== 50) throw new Error(`expected 50 items, got ${items.length}`);

  // --- compute taxonomy tier-derived elite-ideal reference vector ---
  // tier weight: Tier 1 (most important) -> 6 ... Tier 6 -> 1
  const tw = (tier: number) => 7 - tier;
  const dimRaw: Record<string, number[]> = {};
  const sciRaw: Record<string, number[]> = {};
  for (const it of items) {
    (dimRaw[it.section_key] ??= []).push(tw(it.taxonomy_tier));
    if (it.science_dimension) (sciRaw[it.science_dimension] ??= []).push(tw(it.taxonomy_tier));
  }
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const dimMean = Object.fromEntries(Object.entries(dimRaw).map(([k, v]) => [k, mean(v)]));
  const sciMean = Object.fromEntries(Object.entries(sciRaw).map(([k, v]) => [k, mean(v)]));
  const dimScale = 10 / Math.max(...Object.values(dimMean));
  const sciScale = 10 / Math.max(...Object.values(sciMean));
  const reference = [
    ...Object.entries(dimMean).map(([k, v]) => ({ key: `dim.${k}`, value: round3(v * dimScale), description: "elite-ideal importance (taxonomy tier-derived)" })),
    ...Object.entries(sciMean).map(([k, v]) => ({ key: `sci.${k}`, value: round3(v * sciScale), description: "elite-ideal importance per science dimension" })),
  ];

  // --- dimensions ---
  let r = await db.from("eval_dimensions").upsert(DIMENSIONS, { onConflict: "key" });
  if (r.error) throw r.error;
  console.log("✓ dimensions:", DIMENSIONS.length);

  // --- questionnaire (active v1) ---
  const qUp = await db.from("eval_questionnaires")
    .upsert({ version: 1, title: data._meta.title, is_active: true }, { onConflict: "version" })
    .select("id").single();
  if (qUp.error) throw qUp.error;
  const questionnaire_id = qUp.data.id as string;
  console.log("✓ questionnaire v1:", questionnaire_id);

  // --- reference vector ---
  r = await db.from("eval_reference").upsert(reference, { onConflict: "key" });
  if (r.error) throw r.error;
  console.log("✓ reference rows:", reference.length, reference.map(x => `${x.key}=${x.value}`).join(" "));

  // --- items (replace to stay idempotent) ---
  await db.from("eval_items").delete().eq("questionnaire_id", questionnaire_id);
  const rows = items.map((it) => ({
    questionnaire_id,
    section_key: it.section_key,
    ordinal: it.ordinal,
    prompt: it.prompt,
    options: it.options,
    style: it.style,
    science_dimension: it.science_dimension,
    taxonomy_trait_id: it.taxonomy_trait_id,
    taxonomy_tier: it.taxonomy_tier,
    source_citation: it.source_citation,
  }));
  r = await db.from("eval_items").insert(rows);
  if (r.error) throw r.error;
  console.log("✓ items:", rows.length);
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });

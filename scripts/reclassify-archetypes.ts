#!/usr/bin/env npx tsx
/**
 * Recompute the stored `archetype` label on every eval_responses row from its
 * own `fingerprint`, using the corrected shape-based classifier. The old
 * Euclidean classifier let magnitude pick a label (a max-everything vector
 * always got "Athlete-First Scout"); this backfills the fix. Idempotent —
 * re-running only rewrites labels that changed. Prints a before/after table.
 *
 * Usage: npx tsx scripts/reclassify-archetypes.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { classifyArchetype } from "../src/lib/eval/archetype";
import { Fingerprint } from "../src/lib/eval/dimensions";

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

async function main() {
  const { data, error } = await db.from("eval_responses").select("id, archetype, fingerprint, role_at_submit");
  if (error) throw error;
  const rows = data ?? [];
  let changed = 0;
  console.log(`Reclassifying ${rows.length} eval_responses rows...\n`);
  console.log("role     old label                 -> new label");
  console.log("-------------------------------------------------------------");
  for (const r of rows) {
    const next = classifyArchetype(r.fingerprint as Fingerprint).name;
    const flag = next === r.archetype ? "  (unchanged)" : "  <== updated";
    console.log(`${(r.role_at_submit as string).padEnd(8)} ${String(r.archetype).padEnd(25)} -> ${next}${flag}`);
    if (next !== r.archetype) {
      const up = await db.from("eval_responses").update({ archetype: next }).eq("id", r.id);
      if (up.error) throw up.error;
      changed++;
    }
  }
  console.log(`\nDone. ${changed} of ${rows.length} labels updated.`);
}

main().catch((e) => { console.error(e); process.exit(1); });

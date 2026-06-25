#!/usr/bin/env npx tsx
/**
 * Seed the Coach IQ quiz from scripts/data/iq-questions-coach.json.
 * Mirrors scripts/seed-iq.ts but only ever touches the category='coach' quiz,
 * so re-running is safe and never disturbs the general quiz.
 * Idempotent: upserts the quiz on (category, version), then replaces its
 * questions. The `domain`/`tier` fields in the JSON are documentation only and
 * are NOT persisted (the iq_questions table has no column for them).
 * Usage: npx tsx scripts/seed-iq-coach.ts
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
if (!url || !key) { console.error("Missing Supabase env"); process.exit(1); }
const db = createClient(url, key);

type Q = { ordinal: number; prompt: string; choices: string[]; correct_index: number; explanation?: string; points?: number; source_citation?: string };
type Quiz = { category: string; version: number; title: string; description?: string; questions: Q[] };

async function main() {
  const data = JSON.parse(readFileSync(join("scripts", "data", "iq-questions-coach.json"), "utf8"));
  for (const quiz of data.quizzes as Quiz[]) {
    if (quiz.category !== "coach") {
      throw new Error(`seed-iq-coach only seeds category='coach', got '${quiz.category}'`);
    }
    const up = await db
      .from("iq_quizzes")
      .upsert({ category: quiz.category, version: quiz.version, title: quiz.title, description: quiz.description ?? null, is_active: true }, { onConflict: "category,version" })
      .select("id").single();
    if (up.error) throw up.error;
    const quizId = up.data.id as string;

    await db.from("iq_questions").delete().eq("quiz_id", quizId);
    const rows = quiz.questions.map((q) => ({
      quiz_id: quizId,
      ordinal: q.ordinal,
      prompt: q.prompt,
      choices: q.choices,
      correct_index: q.correct_index,
      explanation: q.explanation ?? null,
      points: q.points ?? 1,
      source_citation: q.source_citation ?? null,
    }));
    const ins = await db.from("iq_questions").insert(rows);
    if (ins.error) throw ins.error;
    console.log(`✓ ${quiz.category} v${quiz.version}: ${rows.length} questions`);
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });

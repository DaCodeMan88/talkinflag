#!/usr/bin/env npx tsx
/**
 * Rebalance the STORED answer key so the correct-answer position is uniform
 * (defense in depth — the runtime per-attempt shuffle is the real fix; this
 * makes the persisted key uniform too, so even a leaked bank reveals nothing).
 *
 * For every question in both banks this:
 *   1. assigns the correct answer a target index by round-robin (0,1,2,3,…) so
 *      the correct_index distribution across each quiz is uniform, and
 *   2. deterministically shuffles the distractors into the remaining slots
 *      (fixed seed → reproducible), then
 *   3. rewrites `choices` + `correct_index` in place.
 *
 * It NEVER changes which string is correct, the prompt, or the explanation —
 * only the order of the choices and the matching index. Longest-choice bias is
 * content, not order, so it is handled separately by hand-lengthening a few
 * distractors; this script does not touch choice text.
 *
 *   npx tsx scripts/rebalance-answer-key.ts
 *
 * No DB, no env — reads and rewrites the JSON banks only.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const SEED = 20260801;

/** FNV-1a → mulberry32, same family as src/lib/assessments/shuffle.ts. */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Question = {
  ordinal?: number;
  prompt: string;
  choices: string[];
  correct_index: number;
  [k: string]: unknown;
};
type Quiz = { category: string; questions: Question[]; [k: string]: unknown };
type Bank = { _meta?: unknown; quizzes: Quiz[]; [k: string]: unknown };

const BANKS = ["iq-questions.json", "iq-questions-coach.json"] as const;

function rebalanceQuestion(q: Question, roundRobin: number): Question {
  const L = q.choices.length;
  const correct = q.choices[q.correct_index];
  const distractors = q.choices.filter((_, i) => i !== q.correct_index);

  // Deterministic Fisher–Yates on the distractors, seeded per question.
  const next = rng(hash32(`${SEED}:${q.category ?? ""}:${q.ordinal ?? ""}:${q.prompt}`));
  for (let i = distractors.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
  }

  // Round-robin target slot for the correct answer → uniform distribution.
  const target = roundRobin % L;
  const choices: string[] = [];
  let d = 0;
  for (let slot = 0; slot < L; slot++) {
    if (slot === target) choices.push(correct);
    else choices.push(distractors[d++]);
  }
  return { ...q, choices, correct_index: target };
}

/** Serialize keeping one question per line for a readable, greppable diff. */
function serialize(bank: Bank): string {
  const lines: string[] = ["{"];
  if (bank._meta !== undefined) {
    lines.push(`  "_meta": ${JSON.stringify(bank._meta, null, 2).split("\n").join("\n  ")},`);
  }
  lines.push(`  "quizzes": [`);
  bank.quizzes.forEach((quiz, qi) => {
    const { questions, ...rest } = quiz;
    lines.push(`    {`);
    for (const [k, v] of Object.entries(rest)) {
      lines.push(`      ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
    }
    lines.push(`      "questions": [`);
    questions.forEach((question, i) => {
      const comma = i < questions.length - 1 ? "," : "";
      lines.push(`        ${JSON.stringify(question)}${comma}`);
    });
    lines.push(`      ]`);
    lines.push(`    }${qi < bank.quizzes.length - 1 ? "," : ""}`);
  });
  lines.push(`  ]`);
  lines.push("}");
  return lines.join("\n") + "\n";
}

for (const file of BANKS) {
  const path = join("scripts", "data", file);
  const bank = JSON.parse(readFileSync(path, "utf8")) as Bank;
  for (const quiz of bank.quizzes) {
    const counters: Record<number, number> = {};
    quiz.questions = quiz.questions.map((q) => {
      // Tag the category onto the seed input for cross-bank determinism.
      const withCat = { ...q, category: quiz.category } as Question;
      const L = q.choices.length;
      const rr = counters[L] ?? 0;
      counters[L] = rr + 1;
      const out = rebalanceQuestion(withCat, rr);
      delete (out as Record<string, unknown>).category;
      return out;
    });
  }
  writeFileSync(path, serialize(bank));
  console.log(`✓ rebalanced ${file}`);
}
console.log("Done. Run: npx tsx scripts/audit-answer-key.ts");

/**
 * Answer-key bias audit.
 *
 * Reads both IQ question banks (general + coach) and reports two answer-key
 * exploits per quiz:
 *   1. Position bias  — the correct answer clusters at one choice index.
 *   2. Longest-choice bias — the correct answer is (meaningfully) the longest
 *      string, so a test-taker can guess without knowing the material.
 *
 * This script needs NO database or env — it only reads the JSON banks.
 *
 *   npx tsx scripts/audit-answer-key.ts
 *
 * Exit code: 1 if ANY quiz trips a threshold (maxShare > 0.4 or
 * longest-choice share > 0.4), else 0. On today's banks it is EXPECTED to
 * exit 1 — that failing baseline is what this audit documents. A later task
 * de-biases the banks so this passes.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { positionBias, longestChoiceBias, chiSquareUniform } from "../src/lib/assessments/bias";

interface RawQuestion {
  ordinal?: number;
  prompt: string;
  choices: string[];
  correct_index: number;
}

interface Quiz {
  category: string;
  version?: number;
  title?: string;
  questions: RawQuestion[];
}

interface Bank {
  quizzes: Quiz[];
}

const BANKS = ["iq-questions.json", "iq-questions-coach.json"] as const;

const MAX_SHARE_THRESHOLD = 0.4;
const LONGEST_SHARE_THRESHOLD = 0.4;

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function loadBank(file: string): Bank {
  const raw = readFileSync(join("scripts", "data", file), "utf8");
  return JSON.parse(raw) as Bank;
}

let anyFailed = false;

console.log("=".repeat(70));
console.log("ANSWER-KEY BIAS AUDIT");
console.log("=".repeat(70));

for (const file of BANKS) {
  const bank = loadBank(file);
  for (const quiz of bank.quizzes) {
    const qs = quiz.questions;
    const pos = positionBias(qs);
    const longest = longestChoiceBias(qs);
    const chi = chiSquareUniform(pos.counts);

    const failedPosition = pos.maxShare > MAX_SHARE_THRESHOLD;
    const failedLongest = longest.share > LONGEST_SHARE_THRESHOLD;
    const failed = failedPosition || failedLongest;
    if (failed) anyFailed = true;

    console.log("");
    console.log("-".repeat(70));
    console.log(`Quiz: ${quiz.category}${quiz.title ? `  (${quiz.title})` : ""}`);
    console.log(`File: scripts/data/${file}`);
    console.log(`Questions: ${qs.length}`);
    console.log("");
    console.log("  Position bias:");
    console.log(
      `    counts by index : [${pos.counts.join(", ")}]  (index 0..${pos.counts.length - 1})`
    );
    console.log(
      `    max share       : ${pct(pos.maxShare)}` +
        `  ${failedPosition ? `>  ${pct(MAX_SHARE_THRESHOLD)}  [FAIL]` : `<= ${pct(MAX_SHARE_THRESHOLD)}  [ok]`}`
    );
    console.log(`    chi-square (uniform): ${chi.toFixed(2)}`);
    console.log("");
    console.log("  Longest-choice bias:");
    console.log(
      `    key-is-longest  : ${longest.hits}/${qs.length} = ${pct(longest.share)}` +
        `  ${failedLongest ? `>  ${pct(LONGEST_SHARE_THRESHOLD)}  [FAIL]` : `<= ${pct(LONGEST_SHARE_THRESHOLD)}  [ok]`}`
    );
    console.log(
      `    flagged ordinals (>=1.5x mean distractor): ` +
        `${longest.flagged.length ? `[${longest.flagged.join(", ")}]` : "(none)"}`
    );
    console.log("");
    console.log(`  => ${failed ? "FAIL" : "PASS"}`);
  }
}

console.log("");
console.log("=".repeat(70));
console.log(anyFailed ? "OVERALL: FAIL — answer-key bias detected" : "OVERALL: PASS");
console.log("=".repeat(70));

process.exit(anyFailed ? 1 : 0);

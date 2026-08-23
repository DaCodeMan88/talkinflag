import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// The NFL FLAG rulebook (rev AP03242025) is exact: "'No Run Zones' are located
// 5 yards prior to midfield and 5 yards prior to the opponent's endzone."
// Ambra challenged this question on 2026-08-23 quoting a rulebook that names
// only the end zones. The key was right; the wording ("~5 yards") was vague
// enough to invite the challenge. This test locks the exact wording in.
const BANKS = ["iq-questions.json", "iq-questions-coach.json"] as const;

interface Q { prompt: string; choices: string[]; correct_index: number; explanation?: string; source_citation?: string }

function noRunZoneQuestions(file: string): Q[] {
  const bank = JSON.parse(readFileSync(join("scripts", "data", file), "utf8"));
  return bank.quizzes
    .flatMap((q: { questions: Q[] }) => q.questions)
    .filter((q: Q) => /what is a .no-run zone/i.test(q.prompt));
}

describe("No-Run Zone answer key", () => {
  for (const file of BANKS) {
    it(`${file}: the correct choice names BOTH midfield and the end zone, exactly 5 yards`, () => {
      const qs = noRunZoneQuestions(file);
      expect(qs.length).toBe(1);
      const correct = qs[0].choices[qs[0].correct_index];
      expect(correct).toContain("5 yards before the midfield line-to-gain");
      expect(correct).toContain("5 yards before each end zone");
      expect(correct).not.toContain("~");
    });

    it(`${file}: the correct choice cites the rulebook revision`, () => {
      const qs = noRunZoneQuestions(file);
      expect(qs[0].source_citation ?? "").toContain("AP03242025");
    });
  }
});

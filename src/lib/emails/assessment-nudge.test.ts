import { describe, it, expect } from "vitest";
import { assessmentNudgeEmail } from "./assessment-nudge";

describe("assessment-nudge email", () => {
  it("subject names the remaining count", () => {
    const e = assessmentNudgeEmail({
      firstName: "Maya",
      kind: "eval",
      answered: 6,
      total: 20,
      resumeUrl: "https://talkinflag.com/evaluate",
    });
    expect(e.subject).toContain("14"); // 20 - 6
  });

  it("html contains the resume link and how far they got", () => {
    const e = assessmentNudgeEmail({
      firstName: "Maya",
      kind: "eval",
      answered: 6,
      total: 20,
      resumeUrl: "https://talkinflag.com/evaluate",
    });
    expect(e.html).toContain("https://talkinflag.com/evaluate");
    expect(e.html).toContain("Maya");
    expect(e.html).toContain("6");
    expect(e.html).toContain("20");
  });

  it("phrases the noun for an evaluation", () => {
    const e = assessmentNudgeEmail({
      firstName: "Maya",
      kind: "eval",
      answered: 3,
      total: 12,
      resumeUrl: "https://talkinflag.com/evaluate",
    });
    expect(e.html.toLowerCase()).toContain("evaluation");
  });

  it("phrases the noun for a Flag IQ quiz", () => {
    const e = assessmentNudgeEmail({
      firstName: "there",
      kind: "iq",
      answered: 5,
      total: 30,
      resumeUrl: "https://talkinflag.com/iq/player",
    });
    expect(e.html.toLowerCase()).toContain("iq");
    expect(e.html).toContain("https://talkinflag.com/iq/player");
  });

  it("tone: never scolds", () => {
    const e = assessmentNudgeEmail({
      firstName: "Maya",
      kind: "iq",
      answered: 5,
      total: 30,
      resumeUrl: "https://talkinflag.com/iq/player",
    });
    const blob = (e.subject + " " + e.html).toLowerCase();
    expect(blob).not.toMatch(/failed|abandoned|forgot|gave up|quit/);
  });
});

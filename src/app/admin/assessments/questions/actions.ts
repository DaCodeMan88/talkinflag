"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { positionBias, longestChoiceBias, type BiasQuestion } from "@/lib/assessments/bias";

export type ActionResult = {
  ok: boolean;
  error?: string;
  /** Non-blocking inline warnings (e.g. answer-key bias re-check after save). */
  warnings?: string[];
  /** New status after an approve/retire, so the client can reflect it. */
  newStatus?: string;
};

function revalidate(id: string) {
  revalidatePath("/admin/assessments/questions");
  revalidatePath(`/admin/assessments/questions/${id}`);
}

/**
 * Recompute the answer-key bias audit across every question in a quiz and
 * return human-readable warnings if the correct-answer position or the
 * longest-choice tell exceeds 40%. Never throws — bias is advisory.
 */
async function biasWarningsForQuiz(quizId: string): Promise<string[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("iq_questions")
    .select("choices, correct_index, ordinal")
    .eq("quiz_id", quizId);

  const rows = (data ?? []) as { choices: unknown; correct_index: number; ordinal: number }[];
  const questions: BiasQuestion[] = rows
    .map((r) => ({
      choices: Array.isArray(r.choices) ? (r.choices as string[]) : [],
      correct_index: r.correct_index,
      ordinal: r.ordinal,
    }))
    .filter((q) => q.choices.length > 0);

  const warnings: string[] = [];
  if (questions.length === 0) return warnings;

  const pos = positionBias(questions);
  if (pos.maxShare > 0.4) {
    const idx = pos.counts.indexOf(Math.max(...pos.counts));
    const letter = String.fromCharCode(65 + idx);
    warnings.push(
      `Position bias: ${Math.round(pos.maxShare * 100)}% of correct answers sit at choice ${letter}. Vary the key placement.`
    );
  }

  const longest = longestChoiceBias(questions);
  if (longest.share > 0.4) {
    warnings.push(
      `Longest-choice bias: the correct answer is the longest option in ${Math.round(
        longest.share * 100
      )}% of questions. Even out choice lengths.`
    );
  }

  return warnings;
}

// ---------------------------------------------------------------- IQ actions

export async function saveIqQuestion(
  id: string,
  input: {
    prompt: string;
    choices: string[];
    correct_index: number;
    explanation: string;
    review_note: string;
  }
): Promise<ActionResult> {
  if (!(await getAdminUser())) return { ok: false, error: "Not authorized" };

  const prompt = input.prompt?.trim();
  if (!prompt) return { ok: false, error: "Prompt is required." };

  const choices = (input.choices ?? []).map((c) => (c ?? "").trim()).filter((c) => c.length > 0);
  if (choices.length < 2) return { ok: false, error: "At least two non-empty choices are required." };

  const correct = input.correct_index;
  if (!Number.isInteger(correct) || correct < 0 || correct >= choices.length) {
    return { ok: false, error: "The correct answer must be one of the choices." };
  }

  const db = createAdminClient();
  const { error } = await db
    .from("iq_questions")
    .update({
      prompt,
      choices,
      correct_index: correct,
      explanation: input.explanation?.trim() || null,
      review_note: input.review_note?.trim() || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Recompute bias over the whole quiz (advisory, non-blocking).
  const { data: q } = await db.from("iq_questions").select("quiz_id").eq("id", id).single();
  const warnings = q?.quiz_id ? await biasWarningsForQuiz(q.quiz_id as string) : [];

  revalidate(id);
  return { ok: true, warnings };
}

export async function approveIqQuestion(id: string): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };

  const db = createAdminClient();
  const { error } = await db
    .from("iq_questions")
    .update({
      status: "approved",
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidate(id);
  return { ok: true, newStatus: "approved" };
}

export async function retireIqQuestion(id: string): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };

  const db = createAdminClient();
  const { error } = await db
    .from("iq_questions")
    .update({
      status: "retired",
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidate(id);
  return { ok: true, newStatus: "retired" };
}

// -------------------------------------------------------------- eval actions

export async function saveEvalItem(
  id: string,
  input: { prompt: string; context: string; explanation?: string; review_note: string }
): Promise<ActionResult> {
  if (!(await getAdminUser())) return { ok: false, error: "Not authorized" };

  const prompt = input.prompt?.trim();
  if (!prompt) return { ok: false, error: "Prompt is required." };

  const db = createAdminClient();
  const { error } = await db
    .from("eval_items")
    .update({
      prompt,
      context: input.context?.trim() || null,
      review_note: input.review_note?.trim() || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidate(id);
  return { ok: true };
}

export async function approveEvalItem(id: string): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };

  const db = createAdminClient();
  const { error } = await db
    .from("eval_items")
    .update({
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidate(id);
  return { ok: true };
}

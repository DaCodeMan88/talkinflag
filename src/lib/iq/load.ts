import { createAdminClient } from "@/lib/eval/admin-client";

export type RawQuestion = {
  id: string;
  ordinal: number;
  prompt: string;
  choices: string[];
  correct_index: number;
  explanation: string | null;
  points: number;
  source_citation: string | null;
};

export type PublicQuestion = {
  id: string;
  ordinal: number;
  prompt: string;
  choices: string[];
};

export function stripQuestion(q: RawQuestion): PublicQuestion {
  return { id: q.id, ordinal: q.ordinal, prompt: q.prompt, choices: q.choices };
}

/** Load the active quiz for a category WITH the answer key (server only). */
export async function loadActiveQuiz(category: string): Promise<
  { quizId: string; title: string; description: string | null; questions: RawQuestion[] } | null
> {
  const db = createAdminClient();
  const { data: quiz } = await db
    .from("iq_quizzes")
    .select("id, title, description")
    .eq("category", category)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!quiz) return null;
  const { data: questions } = await db
    .from("iq_questions")
    .select("id, ordinal, prompt, choices, correct_index, explanation, points, source_citation")
    .eq("quiz_id", quiz.id)
    .order("ordinal", { ascending: true });
  return { quizId: quiz.id, title: quiz.title, description: quiz.description, questions: (questions ?? []) as RawQuestion[] };
}

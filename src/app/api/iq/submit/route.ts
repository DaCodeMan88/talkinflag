import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { loadActiveQuiz } from "@/lib/iq/load";
import { scoreAttempt } from "@/lib/iq/score";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { category?: string; answers?: Record<string, number> };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const category = body.category ?? "general";
  const answers = body.answers ?? {};
  if (typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers must be an object" }, { status: 400 });
  }

  const quiz = await loadActiveQuiz(category);
  if (!quiz) return NextResponse.json({ error: "No active quiz" }, { status: 404 });

  const { raw, max, pct } = scoreAttempt(
    quiz.questions.map((q) => ({ id: q.id, correct_index: q.correct_index, points: q.points })),
    answers
  );

  const admin = createAdminClient();
  const { error } = await admin.from("iq_attempts").insert({
    user_id: user.id,
    quiz_id: quiz.quizId,
    category,
    score_raw: raw,
    score_max: max,
    score_pct: pct,
    answers,
  });
  if (error) {
    console.error("iq submit insert error:", error.message);
    return NextResponse.json({ error: "Could not save your attempt" }, { status: 500 });
  }

  // Per-question feedback (now safe to reveal answers).
  const results = quiz.questions.map((q) => ({
    id: q.id,
    ordinal: q.ordinal,
    correct_index: q.correct_index,
    chosen: answers[q.id] ?? null,
    correct: answers[q.id] === q.correct_index,
    explanation: q.explanation,
  }));

  return NextResponse.json({ score_pct: pct, raw, max, results });
}

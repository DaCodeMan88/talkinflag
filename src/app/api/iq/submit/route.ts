import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { loadActiveQuiz } from "@/lib/iq/load";
import { scoreAttempt } from "@/lib/iq/score";
import { toStoredAnswers, displayedCorrectIndex } from "@/lib/iq/shuffle-map";
import { getOwnedSession, recordEvent } from "@/lib/assessments/session";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { category?: string; answers?: Record<string, number>; sessionId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const category = body.category ?? "general";
  const answers = body.answers ?? {};
  if (typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers must be an object" }, { status: 400 });
  }

  const quiz = await loadActiveQuiz(category);
  if (!quiz) return NextResponse.json({ error: "No active quiz" }, { status: 404 });

  // With per-attempt shuffling, the answers the client sends are DISPLAYED
  // indices. Re-derive the same nonce from the (owned) session and map them
  // back into the answer key's stored space before scoring. No session/nonce
  // (older client, missing id) => treat answers as stored indices, unshuffled.
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const session = sessionId ? await getOwnedSession(sessionId, user.id) : null;
  const nonce = session?.nonce ?? null;

  const scoredAnswers = nonce
    ? toStoredAnswers(quiz.questions, nonce, answers)
    : answers;

  const { raw, max, pct } = scoreAttempt(
    quiz.questions.map((q) => ({ id: q.id, correct_index: q.correct_index, points: q.points })),
    scoredAnswers
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

  // Best-effort: mark the telemetry session complete. A missing or foreign
  // session id is ignored silently — it must never block the submission. We
  // already loaded (and ownership-checked) the session above.
  if (sessionId && session) {
    try {
      await recordEvent({ sessionId, type: "complete", answeredCount: Object.keys(answers).length });
    } catch (e) { console.error("session complete error:", e instanceof Error ? e.message : e); }
  }

  // Per-question feedback (now safe to reveal answers). When a nonce is present,
  // both `correct_index` and `chosen` are in DISPLAYED space so the results
  // screen highlights the right on-screen choice; `correct` is computed in the
  // key's stored space. With no nonce we keep today's stored-index behavior.
  const results = quiz.questions.map((q) => {
    const correctIndex = nonce ? displayedCorrectIndex(nonce, q) : q.correct_index;
    const chosenDisplayed = answers[q.id] ?? null;
    return {
      id: q.id,
      ordinal: q.ordinal,
      correct_index: correctIndex,
      chosen: chosenDisplayed,
      correct: scoredAnswers[q.id] === q.correct_index,
      explanation: q.explanation,
    };
  });

  return NextResponse.json({ score_pct: pct, raw, max, results });
}

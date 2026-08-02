import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/eval/admin-client";
import { loadActiveQuiz } from "@/lib/iq/load";
import { displayedCorrectIndex } from "@/lib/iq/shuffle-map";
import { permutationFor, invertChoice } from "@/lib/assessments/shuffle";
import { getOwnedSession, recordEvent } from "@/lib/assessments/session";

/**
 * Instant-feedback check for a SINGLE question. This is the one place that
 * reveals whether an answer was right mid-quiz, so it is the highest-risk
 * surface for farming the answer key:
 *
 *  - The session is ownership-checked (never trust the client's session id).
 *  - A question may be checked ONCE per session. A second check for a question
 *    that already has an `answer` event returns 409 and reveals NOTHING. This is
 *    what stops a client from walking the options to reconstruct the key.
 *  - Only the correct DISPLAYED index for the just-answered question is returned
 *    — never the stored index / nonce.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { sessionId?: string; category?: string; questionId?: string; choice?: number; itemIndex?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const sessionId = typeof body.sessionId === "string" && body.sessionId.length > 0 ? body.sessionId : null;
  const category = typeof body.category === "string" && body.category.length > 0 ? body.category : null;
  const questionId = typeof body.questionId === "string" && body.questionId.length > 0 ? body.questionId : null;
  const choice = body.choice;
  const itemIndex = Number.isInteger(body.itemIndex) && (body.itemIndex as number) >= 0 ? (body.itemIndex as number) : undefined;
  if (!sessionId || !category || !questionId || !Number.isInteger(choice)) {
    return NextResponse.json({ error: "sessionId, category, questionId and choice are required" }, { status: 400 });
  }

  // NEVER trust a client-supplied session id — enforce ownership.
  const session = await getOwnedSession(sessionId, user.id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const admin = createAdminClient();

  // Anti-farming guard: one check per question per session. If this question was
  // already answered in this session, refuse and reveal nothing.
  const { data: existing } = await admin
    .from("assessment_events")
    .select("id")
    .eq("session_id", sessionId)
    .eq("item_id", questionId)
    .eq("type", "answer")
    .limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Question already answered" }, { status: 409 });
  }

  const quiz = await loadActiveQuiz(category);
  if (!quiz) return NextResponse.json({ error: "No active quiz" }, { status: 404 });
  const question = quiz.questions.find((x) => x.id === questionId);
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  // Map the DISPLAYED choice back into the answer key's stored space using this
  // session's nonce, then compare to the (server-only) correct index.
  const perm = permutationFor(session.nonce, questionId, question.choices.length);
  const storedChoice = invertChoice(perm, choice as number);
  const correct = storedChoice === question.correct_index;

  // Record the answer event. This BOTH logs telemetry AND is the row the guard
  // above reads on the next attempt — so in instant mode the runner must NOT
  // also POST /api/assessments/event for this question (that would double-count
  // and trip the guard). See IQQuizRunner: instant mode routes answers here only.
  try {
    await recordEvent({
      sessionId,
      type: "answer",
      itemId: questionId,
      itemIndex,
      correct,
    });
  } catch (e) {
    console.error("iq check event insert error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not record your answer" }, { status: 500 });
  }

  return NextResponse.json({
    correct,
    correctIndexDisplayed: displayedCorrectIndex(session.nonce, question),
    explanation: question.explanation,
  });
}

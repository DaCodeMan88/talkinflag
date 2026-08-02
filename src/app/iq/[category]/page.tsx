import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import { loadActiveQuiz, stripQuestion } from "@/lib/iq/load";
import { shuffleChoices } from "@/lib/iq/shuffle-map";
import { startSession } from "@/lib/assessments/session";
import IQQuizRunner from "@/components/iq/IQQuizRunner";

export const metadata = buildMetadata({
  title: "Flag Football IQ Quiz | Talkin Flag",
  description: "Test your Flag Football IQ — rules, strategy, route concepts, and the 5v5 / 7v7 formats.",
  path: "/iq",
});

export const dynamic = "force-dynamic";

export default async function IQQuizPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/iq/${category}`);

  const quiz = await loadActiveQuiz(category);
  if (!quiz || quiz.questions.length === 0) {
    return (
      <main className="min-h-[70vh] grid place-items-center text-brand-white px-4 text-center">
        <div>
          <h1 className="font-display uppercase tracking-widest text-3xl">Quiz coming soon</h1>
          <p className="mt-3 text-white/70">This Flag IQ quiz isn&apos;t live yet.</p>
        </div>
      </main>
    );
  }

  // Start the telemetry session server-side so the shuffle nonce exists before
  // render. Each public question's choices are reordered into THIS attempt's
  // display order; the submit route re-derives the same nonce to map answers
  // back into the answer key's space. The nonce is never sent to the client.
  const ua = (await headers()).get("user-agent");
  const session = await startSession({
    userId: user.id,
    kind: "iq",
    subjectKey: category,
    totalItems: quiz.questions.length,
    userAgent: ua,
  });
  const questions = quiz.questions.map((q) => shuffleChoices(stripQuestion(q), session.nonce));

  return (
    <main className="bg-brand-black min-h-screen">
      <IQQuizRunner category={category} title={quiz.title} questions={questions} sessionId={session.id} />
    </main>
  );
}

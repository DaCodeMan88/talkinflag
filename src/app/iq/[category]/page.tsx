import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import { loadActiveQuiz, stripQuestion } from "@/lib/iq/load";
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

  return (
    <main className="bg-brand-black min-h-screen">
      <IQQuizRunner category={category} title={quiz.title} questions={quiz.questions.map(stripQuestion)} />
    </main>
  );
}

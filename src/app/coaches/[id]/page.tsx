import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import FollowButton from "@/components/ui/FollowButton";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: coach } = await supabase
    .from("coaches")
    .select("first_name, last_name, team, level")
    .eq("id", id)
    .eq("is_verified", true)
    .single();

  if (!coach) return {};

  const name = `${coach.first_name} ${coach.last_name}`;
  return buildMetadata({
    title: `${name} | Talkin Flag`,
    description: `${name} — verified ${coach.level?.replaceAll("_", " ")} flag football coach at ${coach.team}.`,
    path: `/coaches/${id}`,
  });
}

export default async function CoachProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: coach } = await supabase
    .from("coaches")
    .select("id, first_name, last_name, team, level, title, years_coaching, wins, losses, philosophy, bio, is_verified")
    .eq("id", id)
    .eq("is_verified", true)
    .single();

  if (!coach) notFound();

  const levelFormatted = coach.level?.replaceAll("_", " ").toUpperCase() ?? null;
  const hasRecord = coach.wins !== null || coach.losses !== null;

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": `${coach.first_name} ${coach.last_name}`,
    "jobTitle": coach.title ?? `Flag Football Coach`,
    "worksFor": coach.team ? { "@type": "SportsOrganization", "name": coach.team } : undefined,
    "url": `https://talkinflag.com/coaches/${coach.id}`,
    "description": coach.bio ?? undefined,
  };

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="max-w-2xl mx-auto">

        <Link
          href="/coaches"
          className="text-brand-white/30 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors mb-10 inline-block"
        >
          ← All Coaches
        </Link>

        {/* Header */}
        <div className="border-l-4 border-brand-yellow pl-6 mb-10 mt-4">
          <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-3">
            {levelFormatted && (
              <span className="bg-brand-yellow text-brand-black text-xs font-display uppercase tracking-widest px-2 py-0.5">
                {levelFormatted}
              </span>
            )}
            <span className="border border-brand-yellow/40 text-brand-yellow text-xs px-2 py-0.5 font-display uppercase tracking-widest">
              ✓ Verified
            </span>
          </div>
          <FollowButton followedId={coach.id} followedType="coach" isLoggedIn={!!user} />
          </div>
          <h1 className="font-display text-5xl md:text-6xl uppercase text-brand-white leading-none mt-3">
            {coach.first_name} {coach.last_name}
          </h1>
          <p className="text-brand-yellow font-display text-lg uppercase tracking-widest mt-2">
            {coach.team}
          </p>
          {coach.title && (
            <p className="text-brand-white/40 text-sm mt-1">{coach.title}</p>
          )}
        </div>

        {/* Stats row */}
        {(hasRecord || coach.years_coaching !== null) && (
          <div className="grid grid-cols-3 gap-px bg-brand-white/5 mb-8">
            {hasRecord && (
              <div className="bg-[#0d0d0d] p-5 text-center">
                <p className="font-display text-3xl text-brand-white">
                  {coach.wins ?? "—"}
                  <span className="text-brand-white/30">–</span>
                  {coach.losses ?? "—"}
                </p>
                <p className="text-brand-white/30 text-xs font-display uppercase tracking-widest mt-1">Record</p>
              </div>
            )}
            {coach.years_coaching !== null && (
              <div className="bg-[#0d0d0d] p-5 text-center">
                <p className="font-display text-3xl text-brand-white">{coach.years_coaching}</p>
                <p className="text-brand-white/30 text-xs font-display uppercase tracking-widest mt-1">Years Coaching</p>
              </div>
            )}
          </div>
        )}

        {/* Philosophy */}
        {coach.philosophy && (
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-6 mb-4">
            <p className="text-brand-white/30 text-xs font-display uppercase tracking-widest mb-3">Philosophy</p>
            <p className="text-brand-white/80 italic leading-relaxed">
              &ldquo;{coach.philosophy}&rdquo;
            </p>
          </div>
        )}

        {/* Bio */}
        {coach.bio && (
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-6 mb-8">
            <p className="text-brand-white/30 text-xs font-display uppercase tracking-widest mb-3">About</p>
            <p className="text-brand-white/70 leading-relaxed whitespace-pre-line">{coach.bio}</p>
          </div>
        )}

        {/* Share */}
        <div className="border-t border-brand-white/5 pt-8 text-center">
          <p className="text-brand-white/20 text-xs font-display uppercase tracking-widest">
            talkinflag.com/coaches/{coach.id}
          </p>
        </div>
      </div>
    </div>
  );
}

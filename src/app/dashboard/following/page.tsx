import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Following | Talkin Flag" };

export default async function FollowingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/following");

  const { data: followRows } = await supabase
    .from("follows")
    .select("followed_id, followed_type, created_at")
    .eq("follower_id", user.id)
    .order("created_at", { ascending: false });

  const follows = followRows ?? [];

  const playerIds = follows.filter((f) => f.followed_type === "player").map((f) => f.followed_id);
  const coachIds = follows.filter((f) => f.followed_type === "coach").map((f) => f.followed_id);

  const [playersRes, coachesRes] = await Promise.all([
    playerIds.length > 0
      ? supabase
          .from("players")
          .select("id, first_name, last_name, position, school_or_team, photo_url, is_verified, level")
          .in("id", playerIds)
      : { data: [] },
    coachIds.length > 0
      ? supabase
          .from("coaches")
          .select("id, first_name, last_name, team, level, title, is_verified")
          .in("id", coachIds)
      : { data: [] },
  ]);

  const playerMap = new Map((playersRes.data ?? []).map((p) => [p.id, p]));
  const coachMap = new Map((coachesRes.data ?? []).map((c) => [c.id, c]));

  const followedPlayers = follows
    .filter((f) => f.followed_type === "player" && playerMap.has(f.followed_id))
    .map((f) => playerMap.get(f.followed_id)!);

  const followedCoaches = follows
    .filter((f) => f.followed_type === "coach" && coachMap.has(f.followed_id))
    .map((f) => coachMap.get(f.followed_id)!);

  const total = followedPlayers.length + followedCoaches.length;

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-start justify-between mb-10">
          <div className="border-l-4 border-brand-yellow pl-6">
            <Link
              href="/dashboard"
              className="text-brand-white/30 text-xs font-display uppercase tracking-widest hover:text-brand-yellow transition-colors block mb-3"
            >
              ← Dashboard
            </Link>
            <h1 className="font-display text-4xl uppercase text-brand-white leading-none">
              Following
            </h1>
            <p className="text-brand-white/40 mt-2 text-sm">
              {total === 0 ? "Nobody yet" : `${total} ${total === 1 ? "profile" : "profiles"}`}
            </p>
          </div>
        </div>

        {total === 0 && (
          <div className="bg-[#0d0d0d] border border-brand-white/10 p-10 text-center space-y-4">
            <p className="text-brand-white/40 text-sm">
              Follow players and coaches to get a personalized weekly digest.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/players"
                className="bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-xs py-2 px-5 hover:bg-brand-yellow/90 transition-colors"
              >
                Browse Players
              </Link>
              <Link
                href="/coaches"
                className="border border-brand-yellow/40 text-brand-yellow font-display uppercase tracking-widest text-xs py-2 px-5 hover:border-brand-yellow transition-colors"
              >
                Browse Coaches
              </Link>
            </div>
          </div>
        )}

        {followedPlayers.length > 0 && (
          <section className="mb-8">
            <h2 className="text-brand-white/30 text-xs font-display uppercase tracking-widest mb-4">
              Players
            </h2>
            <div className="space-y-2">
              {followedPlayers.map((p) => (
                <Link
                  key={p.id}
                  href={`/players/${p.id}`}
                  className="flex items-center gap-4 bg-[#0d0d0d] border border-brand-white/10 p-4 hover:border-brand-yellow/30 transition-colors"
                >
                  <div className="relative w-10 h-10 flex-shrink-0">
                    {p.photo_url ? (
                      <Image
                        src={p.photo_url}
                        alt={`${p.first_name} ${p.last_name}`}
                        fill
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center">
                        <span className="font-display text-sm text-brand-yellow">
                          {p.first_name[0]}{p.last_name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-white font-semibold text-sm truncate">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-brand-white/40 text-xs truncate">
                      {[p.position, p.school_or_team].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {p.is_verified && (
                    <span className="text-brand-yellow text-xs font-display uppercase tracking-widest flex-shrink-0">
                      ✓
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {followedCoaches.length > 0 && (
          <section>
            <h2 className="text-brand-white/30 text-xs font-display uppercase tracking-widest mb-4">
              Coaches
            </h2>
            <div className="space-y-2">
              {followedCoaches.map((c) => (
                <Link
                  key={c.id}
                  href={`/coaches/${c.id}`}
                  className="flex items-center gap-4 bg-[#0d0d0d] border border-brand-white/10 p-4 hover:border-brand-yellow/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-sm text-brand-yellow">
                      {c.first_name[0]}{c.last_name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-white font-semibold text-sm truncate">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="text-brand-white/40 text-xs truncate">
                      {[c.title, c.team].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {c.is_verified && (
                    <span className="text-brand-yellow text-xs font-display uppercase tracking-widest flex-shrink-0">
                      ✓ Verified
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

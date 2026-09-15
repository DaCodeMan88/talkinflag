import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import { getAllInstagramPosts, MAX_LIVE_POSTS } from "@/lib/media/instagram";
import { daysSinceLastCuration, STALE_AFTER_DAYS } from "./staleness";
import { InstagramGridEditor } from "./InstagramGridEditor";

export const dynamic = "force-dynamic";

function Header({ children }: { children?: React.ReactNode }) {
  return (
    <div className="border-l-4 border-[#FDDD58] pl-6 mb-8">
      <h1 className="font-display text-4xl uppercase text-white leading-none mt-1">Media</h1>
      {children}
    </div>
  );
}

export default async function AdminMediaPage() {
  if (!(await getAdminUser())) redirect("/");

  const result = await getAllInstagramPosts();

  /*
    Migration 027 is deliberately unapplied in production, so today this is the
    branch that renders. The owner gets the plain-English situation and no form
    — typing a reel into a box that cannot possibly save is worse than showing
    nothing. The raw Postgres message is kept, small and last, for a developer.
  */
  if (!result.ok) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Header />
        <div className="bg-[#0d0d0d] border border-white/10 p-6">
          <p className="font-display text-xs uppercase tracking-[0.25em] text-[#FDDD58] mb-3">
            Not set up yet
          </p>
          <p className="text-white/70 text-sm leading-relaxed">
            The Instagram grid isn&rsquo;t set up yet. Migration 027 hasn&rsquo;t been applied to
            the database, so there&rsquo;s nothing to edit here.
          </p>
          <p className="text-white/70 text-sm leading-relaxed mt-3">
            Nothing is broken on the public side:{" "}
            <Link href="/media" className="text-[#FDDD58] hover:underline">
              talkinflag.com/media
            </Link>{" "}
            is still showing the original nine reels. Ask Daniel to apply the migration, and this
            page becomes editable.
          </p>
          <p className="text-white/25 text-xs mt-6 break-words">
            For a developer — the database said: {result.error}
          </p>
        </div>
      </div>
    );
  }

  const live = result.posts.filter((r) => r.is_live);
  const retired = result.posts.filter((r) => !r.is_live);
  const staleDays = daysSinceLastCuration(result.posts);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Header>
        <p className="text-white/40 mt-2 text-sm">
          The {MAX_LIVE_POSTS} reels on{" "}
          <Link href="/media" className="text-[#FDDD58] hover:underline">
            talkinflag.com/media
          </Link>
          . {live.length} of {MAX_LIVE_POSTS} slots used.
        </p>
      </Header>

      {/* The monthly job, spelled out — this page is the only place it's written down. */}
      <div className="bg-[#0d0d0d] border border-white/10 p-6 mb-8">
        <p className="font-display text-xs uppercase tracking-[0.25em] text-[#FDDD58] mb-3">
          Once a month
        </p>
        <ol className="text-white/50 text-sm space-y-1 list-decimal list-inside">
          <li>
            Instagram app → Professional dashboard → Insights → Reels → sort by Plays (last 90
            days).
          </li>
          <li>If a reel beat one on this page, copy its link.</li>
          <li>Retire the weakest one below, then paste the new link in.</li>
        </ol>
        {staleDays !== null && (
          <p
            className={`text-xs mt-4 ${
              staleDays > STALE_AFTER_DAYS ? "text-amber-400" : "text-white/30"
            }`}
          >
            Last curated {staleDays} {staleDays === 1 ? "day" : "days"} ago
            {staleDays > STALE_AFTER_DAYS ? " — worth a check." : "."}
          </p>
        )}
      </div>

      <InstagramGridEditor live={live} retired={retired} />
    </div>
  );
}

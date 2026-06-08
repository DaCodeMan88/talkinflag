import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HighlightActions } from "./HighlightActions";
import { PublishTop10Form } from "./PublishTop10Form";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "talkinflagshow@gmail.com").split(",").map((e) => e.trim()).filter(Boolean);

type Submission = {
  id: string;
  video_url: string;
  description: string | null;
  play_type: string | null;
  status: string;
  created_at: string;
  week_featured: string | null;
  rank_in_week: number | null;
  players: { first_name: string; last_name: string; position: string | null } | null;
};

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export default async function AdminHighlightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/admin/highlights");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) {
    return <div className="p-8 text-white"><p className="text-red-400">Not authorized.</p></div>;
  }

  const [{ data: pendingRaw }, { data: approvedRaw }, { data: recentRaw }] = await Promise.all([
    supabase
      .from("highlight_submissions")
      .select("id, video_url, description, play_type, status, created_at, week_featured, rank_in_week, players(first_name, last_name, position)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("highlight_submissions")
      .select("id, video_url, description, play_type, status, created_at, week_featured, rank_in_week, players(first_name, last_name, position)")
      .eq("status", "approved")
      .order("created_at", { ascending: true }),
    supabase
      .from("highlight_submissions")
      .select("id, video_url, description, play_type, status, created_at, week_featured, rank_in_week, players(first_name, last_name, position)")
      .in("status", ["top10", "rejected"])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const pending = (pendingRaw ?? []) as unknown as Submission[];
  const approved = (approvedRaw ?? []) as unknown as Submission[];
  const recent = (recentRaw ?? []) as unknown as Submission[];

  // Top 10 candidates = approved submissions
  const candidates = approved.map((s) => ({
    id: s.id,
    video_url: s.video_url,
    description: s.description,
    play_type: s.play_type,
    players: s.players,
  }));

  function SubmissionCard({ s }: { s: Submission }) {
    const embedUrl = youtubeEmbedUrl(s.video_url);
    const date = new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return (
      <div className="bg-[#0d0d0d] border border-white/10 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white font-semibold">
              {s.players ? `${s.players.first_name} ${s.players.last_name}` : "Anonymous"}
              {s.players?.position && (
                <span className="text-white/40 text-xs ml-2">· {s.players.position}</span>
              )}
            </p>
            {s.play_type && (
              <span className="inline-block mt-1 bg-[#FDDD58]/15 text-[#FDDD58] text-xs px-2 py-0.5">
                {s.play_type}
              </span>
            )}
            {s.description && (
              <p className="text-white/50 text-sm mt-1">{s.description}</p>
            )}
          </div>
          <span className="text-white/30 text-xs shrink-0">{date}</span>
        </div>

        {/* Video embed or link */}
        {embedUrl ? (
          <div className="aspect-video w-full max-w-sm">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <a
            href={s.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FDDD58] text-sm hover:underline block truncate"
          >
            {s.video_url}
          </a>
        )}

        <HighlightActions id={s.id} status={s.status} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-14">
      <div>
        <Link href="/admin" className="text-white/30 hover:text-white/60 text-xs font-display uppercase tracking-widest transition-colors">
          ← Admin
        </Link>
        <div className="border-l-4 border-[#FDDD58] pl-6 mt-4">
          <h1 className="font-display text-4xl uppercase text-white leading-none">Highlights</h1>
          <p className="text-white/40 mt-2 text-sm">
            {pending.length} pending · {approved.length} approved &amp; ready for Top 10
          </p>
        </div>
      </div>

      {/* Pending */}
      <section className="space-y-4">
        <h2 className="font-display text-sm uppercase tracking-widest text-white/40">
          Pending Review ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-white/20 text-sm">No pending submissions.</p>
        ) : (
          pending.map((s) => <SubmissionCard key={s.id} s={s} />)
        )}
      </section>

      {/* Approved / Top 10 candidates */}
      <section className="space-y-4">
        <h2 className="font-display text-sm uppercase tracking-widest text-white/40">
          Approved — Top 10 Candidates ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="text-white/20 text-sm">No approved submissions yet.</p>
        ) : (
          approved.map((s) => <SubmissionCard key={s.id} s={s} />)
        )}

        <PublishTop10Form candidates={candidates} />
      </section>

      {/* Recent decisions */}
      {recent.length > 0 && (
        <section>
          <h2 className="font-display text-sm uppercase tracking-widest text-white/40 mb-4">
            Recently Decided
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-white/60">
              <thead>
                <tr className="border-b border-white/10 text-white/30 text-xs uppercase tracking-wider">
                  <th className="text-left pb-2 pr-4">Player</th>
                  <th className="text-left pb-2 pr-4">Play</th>
                  <th className="text-left pb-2 pr-4">Status</th>
                  <th className="text-left pb-2">Week</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recent.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 pr-4">
                      {s.players ? `${s.players.first_name} ${s.players.last_name}` : "—"}
                    </td>
                    <td className="py-2 pr-4 text-xs text-white/30">{s.play_type ?? "—"}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 font-display uppercase tracking-wide ${
                        s.status === "top10"
                          ? "bg-[#FDDD58]/15 text-[#FDDD58]"
                          : "bg-red-900/30 text-red-400"
                      }`}>
                        {s.status === "top10" ? `★ Top 10 · #${s.rank_in_week}` : "Rejected"}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-white/30">{s.week_featured ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

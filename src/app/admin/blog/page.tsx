import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import { toPostRecordFromDb } from "@/lib/blog/posts";
import { seoChecklist } from "@/lib/blog/seo";
import { staticPosts } from "@/lib/static-posts";

export const dynamic = "force-dynamic";

type Status = "draft" | "published" | "archived";

interface DbRow {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  category: string | null;
  status: Status;
  published_at: string | null;
  updated_at: string | null;
  [key: string]: unknown;
}

const STATUS_STYLE: Record<Status, string> = {
  published: "bg-[#FDDD58] text-black",
  draft: "bg-white/15 text-white",
  archived: "bg-white/5 text-white/40",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Passing count of the SEO checklist for a DB row, e.g. "5/6". */
function seoScore(row: DbRow): string {
  const rec = toPostRecordFromDb(row as unknown as Parameters<typeof toPostRecordFromDb>[0]);
  const checks = seoChecklist({
    title: rec.title,
    seoDescription: rec.seoDescription ?? "",
    body: rec.body,
    coverImageUrl: rec.coverImageUrl,
    faqItems: rec.faqItems,
    keyTakeaways: rec.keyTakeaways,
  });
  const pass = checks.filter((c) => c.pass).length;
  return `${pass}/${checks.length}`;
}

export default async function AdminBlogPage() {
  if (!(await getAdminUser())) redirect("/");

  const db = createAdminClient();
  const { data, error } = await db
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) console.error("AdminBlogPage:", error.message);
  const rows = (error ? [] : (data ?? [])) as DbRow[];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="border-l-4 border-[#FDDD58] pl-6">
          <h1 className="font-display text-4xl uppercase text-white leading-none mt-1">Blog</h1>
          <p className="text-white/40 mt-2 text-sm">
            {rows.length} post{rows.length === 1 ? "" : "s"} — click any one to
            edit, publish, or delete it
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="bg-[#FDDD58] text-black font-display uppercase tracking-widest text-xs py-2.5 px-5 hover:bg-[#FDDD58]/90 transition-colors shrink-0"
        >
          + New Post
        </Link>
      </div>

      {/* DB posts — desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/30 text-[10px] font-display uppercase tracking-widest border-b border-white/10">
              <th className="py-2 pr-4 font-normal">Title</th>
              <th className="py-2 px-4 font-normal">Category</th>
              <th className="py-2 px-4 font-normal">Status</th>
              <th className="py-2 px-4 font-normal">Published</th>
              <th className="py-2 px-4 font-normal">Author</th>
              <th className="py-2 pl-4 font-normal">SEO</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
              >
                <td className="py-3 pr-4">
                  <Link href={`/admin/blog/${row.id}`} className="text-white font-semibold group-hover:text-[#FDDD58] transition-colors">
                    {row.title}
                  </Link>
                </td>
                <td className="py-3 px-4 text-white/50">{row.category || "—"}</td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-display uppercase tracking-widest ${STATUS_STYLE[row.status] ?? STATUS_STYLE.draft}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-white/50">{formatDate(row.published_at)}</td>
                <td className="py-3 px-4 text-white/50">{row.author || "—"}</td>
                <td className="py-3 pl-4 text-white/50">{seoScore(row)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-white/30 text-sm">
                  No posts yet. Create your first one with “+ New Post”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DB posts — mobile cards */}
      <div className="md:hidden space-y-2">
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/admin/blog/${row.id}`}
            className="block bg-[#0d0d0d] border border-white/10 hover:border-[#FDDD58]/40 transition-colors px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-white text-sm font-semibold min-w-0">{row.title}</p>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-display uppercase tracking-widest ${STATUS_STYLE[row.status] ?? STATUS_STYLE.draft}`}>
                {row.status}
              </span>
            </div>
            <p className="text-white/35 text-xs mt-1">
              {[row.category, formatDate(row.published_at), row.author, `SEO ${seoScore(row)}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </Link>
        ))}
        {rows.length === 0 && (
          <p className="text-white/30 text-sm py-8 text-center">
            No posts yet. Create your first one with “+ New Post”.
          </p>
        )}
      </div>

      {/*
        Any post still hard-coded in `staticPosts` (empty since the 2026-08-03
        migration to this table) is listed read-only — it can't be edited or
        deleted here, so saying so beats leaving it invisible.
      */}
      {staticPosts.length > 0 && (
        <div className="mt-12">
          <p className="text-white/25 text-[10px] font-display uppercase tracking-widest mb-3">
            Code posts (not editable here)
          </p>
          <div className="space-y-2">
            {staticPosts.map((p) => (
              <div
                key={p.slug}
                className="flex items-center justify-between gap-3 bg-[#0a0a0a] border border-white/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-white/60 text-sm font-semibold truncate">{p.title}</p>
                  <p className="text-white/25 text-xs truncate">
                    {[p.category, formatDate(p.publishedAt), p.author].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-display uppercase tracking-widest bg-white/5 text-white/40">
                  Code
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

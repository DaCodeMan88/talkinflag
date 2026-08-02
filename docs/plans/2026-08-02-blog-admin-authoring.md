# Blog Admin Authoring + Auto SEO/GEO Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let logged-in admins (Ambra & Tika) create, edit, and publish blog posts — with images — from inside `/admin`, no deploy required, where each post is automatically optimized for SEO and GEO, renders identically to the existing hand-written posts, and gets appropriate internal links, external links, and a related-posts backlink web.

**Architecture:** A Supabase-backed `blog_posts` table becomes a third post source alongside the existing hardcoded `staticPosts` and the (unconfigured) Sanity fallback. A single unified loader merges all three by slug. The public blog list + detail pages keep their exact current render path — the same `RichText` renderer and the same Article / Breadcrumb / FAQ JSON-LD — so DB posts are visually and structurally cohesive with the existing ones. An in-app admin CRUD (matching the established `/admin` + server-action + `getAdminUser` patterns) provides the editor; images upload to Supabase Storage (reusing the player-photo upload pattern). "Auto SEO/GEO" is a tested pure helper plus a live editor checklist.

**Tech Stack:** Next.js 15 App Router · TypeScript · Tailwind · Supabase (Postgres + Storage + RLS) · Vitest

---

## Terminology & decisions (read before Task 1)

- **SEO** = Search Engine Optimization (Google et al.). **GEO** = Generative Engine Optimization — being cited by AI answer engines (ChatGPT, Perplexity, Google AI Overviews). Both are served by the same mechanics: clean structured data, an explicit Q&A/FAQ block, a quotable "key takeaways" summary, clear entity naming, and crawlable HTML. This plan treats them together. *(If the owner meant geographic/"local" GEO, the plan still helps but add location metadata — flagged in Task 8.)*
- **Body format:** markdown-lite, exactly what the existing `RichText` component already renders (`**bold**`, `[text](url)`, standalone `**heading**` paragraphs → `<h3>` anchors, `- ` bullet blocks, plain paragraphs). DB posts store the same string shape as `staticPosts[].body`, so they render through the identical path with zero divergence. No new rich-text engine, no Sanity dependency.
- **Source of truth precedence:** published `blog_posts` (DB) → `staticPosts` (code) → Sanity. Dedupe by slug, DB wins. The existing static posts stay as-is (no migration of them required); admins can optionally re-create any in the DB later.
- **Auth/RLS:** `blog_posts` is admin-managed. Public reads need only *published* rows. Use a **service-role client for admin writes + draft reads** (per the repo's RLS rules), and either a narrow public SELECT policy (`status = 'published'`) OR read published posts through the existing server components with the service-role client (matching how other content is read server-side). This plan uses a public SELECT policy limited to published rows so the blog list stays a plain server fetch.
- **Images:** Supabase Storage bucket `blog` (public read). Reuse the upload approach in `src/app/api/players/[id]/photo/route.ts`.

---

## Current-state facts this plan builds on

- Blog list `src/app/blog/page.tsx` reads `getAllPosts()` (Sanity, returns `[]` — unconfigured) + `staticPosts`; `revalidate = 300`.
- Detail `src/app/blog/[slug]/page.tsx` renders a static post via `<RichText body={post.body} />` and already emits **Article**, **BreadcrumbList**, and **FAQPage** JSON-LD, a reading-time, and a heading table-of-contents. This is the cohesive render target — reuse it.
- `src/lib/static-posts.ts` defines `StaticPost` (`slug,title,author,publishedAt,category,excerpt,body,faqItems?,youtubeVideoId?,guestName?,guestRole?`). New DB posts map onto this same shape.
- `src/app/sitemap.ts` and `src/app/blog/feed.xml/route.ts` enumerate `staticPosts` — both must also include published DB posts.
- Supabase Storage is already used (`api/players/[id]/photo/route.ts`) — established pattern for uploads.
- Admin conventions: page gate `if (!(await getAdminUser())) redirect("/")`; server actions re-check `getAdminUser`; all admin DB access via `createAdminClient()`; `AdminSidebar.tsx` NAV array; brand `brand-black/gray/white/yellow`, `font-display uppercase tracking-widest`.

---

## Task map

| # | Task |
|---|---|
| 1 | `blog_posts` schema + Storage bucket (migration) |
| 2 | `PostRecord` type + unified post loader (DB→static→Sanity, dedup) |
| 3 | Wire the unified loader into blog list, detail, sitemap, RSS |
| 4 | Auto-SEO/GEO helper (slug, meta, takeaways, checklist) — TDD |
| 5 | Admin blog list `/admin/blog` |
| 6 | Admin editor (create/edit) + server actions |
| 7 | Image upload to Supabase Storage |
| 8 | SEO/GEO editor panel (live checklist + JSON-LD preview) |
| 9 | Internal-link suggester + related-posts backlinks |
| 10 | Publish flow (draft→published, revalidate) + verification |

Tasks 1–3 are the spine (data + rendering) and are independently shippable — once done, an admin-inserted DB row already appears on the blog. Tasks 4–10 build the authoring experience on top. Commit after every task.

---

## Task 1: `blog_posts` schema + image bucket

**Files:** Create `supabase/migrations/025_blog_posts.sql` (apply via Supabase MCP).

**Step 1:** Migration:
```sql
-- Admin-authored blog posts. A third source alongside code staticPosts + Sanity.
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Talkin Flag',
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,                       -- markdown-lite (same shape as staticPosts.body)
  cover_image_url TEXT,
  cover_image_alt TEXT,
  -- SEO/GEO
  seo_title TEXT,                           -- <title>/OG title override; falls back to title
  seo_description TEXT,                      -- meta description; falls back to excerpt
  og_image_url TEXT,                         -- social card; falls back to cover_image_url
  key_takeaways JSONB DEFAULT '[]'::jsonb,   -- string[] — the GEO-quotable summary bullets
  faq_items JSONB DEFAULT '[]'::jsonb,       -- [{q,a}] → FAQPage JSON-LD
  -- lifecycle
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_pub ON blog_posts(status, published_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
-- Public may read ONLY published posts; all writes + draft reads go through the
-- service-role client in admin code (never the cookie client).
CREATE POLICY blog_posts_public_read ON blog_posts
  FOR SELECT USING (status = 'published');
```

**Step 2:** Apply via MCP `apply_migration` (name `025_blog_posts`).

**Step 3:** Create the public-read Storage bucket `blog` (via MCP `execute_sql` using `storage.create_bucket`, or document it as an owner one-click in the Supabase dashboard if the SQL helper isn't available):
```sql
insert into storage.buckets (id, name, public) values ('blog','blog', true)
on conflict (id) do nothing;
```

**Step 4:** Verify:
```sql
select count(*) from blog_posts;                       -- 0
select id, public from storage.buckets where id='blog'; -- one row, public=true
select policyname from pg_policies where tablename='blog_posts'; -- blog_posts_public_read
```

**Step 5:** Commit the migration file.
```bash
git add supabase/migrations/025_blog_posts.sql && git commit -m "feat: blog_posts table + public blog image bucket"
```

---

## Task 2: Unified post type + loader

**Files:** Create `src/lib/blog/posts.ts` + `src/lib/blog/posts.test.ts`.

**Step 1 (TDD):** Write failing tests for the pure merge/dedup logic:
```ts
import { describe, it, expect } from "vitest";
import { mergePostsBySlug, toPostRecordFromStatic } from "./posts";

describe("mergePostsBySlug", () => {
  it("dedupes by slug with DB winning over static", () => {
    const db = [{ slug: "a", title: "DB A", publishedAt: "2026-02-01" } as any];
    const stat = [{ slug: "a", title: "Static A", publishedAt: "2026-01-01" } as any,
                   { slug: "b", title: "Static B", publishedAt: "2026-01-02" } as any];
    const merged = mergePostsBySlug(db, stat);
    expect(merged.find(p => p.slug === "a")!.title).toBe("DB A");
    expect(merged).toHaveLength(2);
  });
  it("sorts newest first by publishedAt", () => {
    const merged = mergePostsBySlug(
      [{ slug: "new", publishedAt: "2026-03-01" } as any],
      [{ slug: "old", publishedAt: "2026-01-01" } as any]
    );
    expect(merged.map(p => p.slug)).toEqual(["new", "old"]);
  });
});
```

**Step 2:** Run → FAIL. Implement `src/lib/blog/posts.ts`:
- `export type PostRecord` — a superset of `StaticPost` fields plus `coverImageUrl?, coverImageAlt?, seoTitle?, seoDescription?, ogImageUrl?, keyTakeaways?: string[]`, and `source: "db" | "static" | "sanity"`.
- `toPostRecordFromStatic(p: StaticPost): PostRecord` and `toPostRecordFromDb(row): PostRecord` (maps snake_case DB columns → camel; parses `faq_items`→`faqItems`).
- `mergePostsBySlug(db: PostRecord[], rest: PostRecord[]): PostRecord[]` — DB wins on slug collision, then sort by `publishedAt` desc (pure, tested).
- `getPublishedDbPosts(): Promise<PostRecord[]>` — `createAdminClient().from("blog_posts").select(...).eq("status","published").order("published_at",{ascending:false})`, mapped. Returns `[]` on error (never throw into a page).
- `getAllPostRecords(): Promise<PostRecord[]>` — merge DB + static (+ Sanity if `sanityConfigured`).
- `getPostRecordBySlug(slug): Promise<PostRecord | null>` — DB published first, else static, else Sanity.

**Step 3:** Run → PASS. `npx tsc --noEmit` clean.

**Step 4:** Commit.
```bash
git add src/lib/blog && git commit -m "feat: unified blog post loader (DB + static + Sanity)"
```

---

## Task 3: Render DB posts on the public blog (list, detail, sitemap, RSS)

**Files:** Modify `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`, `src/app/sitemap.ts`, `src/app/blog/feed.xml/route.ts`.

**Step 1:** Blog list — replace the `staticPosts` + `getAllPosts()` sourcing with `getAllPostRecords()`. Keep the category filter, "New" badge, `PostCard`, and `revalidate` behavior. `PostCard` should need no change (feed it `PostRecord` fields it already expects: title/slug/excerpt/category/publishedAt/cover image).

**Step 2:** Detail — replace `getStaticPostBySlug` + Sanity branch with `getPostRecordBySlug(slug)`. Keep the **exact** existing render: `<RichText body={post.body} />`, the Article/Breadcrumb/FAQ JSON-LD, reading time, and TOC. Use `seoTitle`/`seoDescription`/`ogImageUrl` in `generateMetadata` with fallbacks to `title`/`excerpt`/`coverImageUrl`. `generateStaticParams` must include DB published slugs (union of DB + static; keep it resilient if the DB is unreachable at build — wrap in try/catch, fall back to static only).

**Step 3:** Sitemap — add published DB slugs to `blogPages` (union with static; dedupe by slug). RSS `feed.xml` — same union.

**Step 4:** Verify end-to-end with a seeded row (insert one published `blog_posts` row via MCP `execute_sql`, then):
```bash
npm run dev
```
Open `/blog` — the seeded post appears; open `/blog/<slug>` — it renders through `RichText` with JSON-LD present (view source: `application/ld+json` Article + FAQ). Confirm at 375px. Then delete the seed row.

**Step 5:** `npx tsc --noEmit && npm run build` green. Commit.
```bash
git add -A && git commit -m "feat: serve DB blog posts on list, detail, sitemap, RSS"
```

---

## Task 4: Auto-SEO/GEO helper (TDD)

**Files:** Create `src/lib/blog/seo.ts` + `src/lib/blog/seo.test.ts`.

**Step 1:** Failing tests:
```ts
import { describe, it, expect } from "vitest";
import { slugify, autoMetaDescription, seoChecklist } from "./seo";

describe("slugify", () => {
  it("makes a clean url slug", () => {
    expect(slugify("Katherine Sowers: What's Next?!")).toBe("katherine-sowers-whats-next");
  });
});
describe("autoMetaDescription", () => {
  it("trims to <=160 chars on a word boundary", () => {
    const d = autoMetaDescription("a ".repeat(200));
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith(" ")).toBe(false);
  });
});
describe("seoChecklist", () => {
  it("flags a title over 60 chars, missing meta, no cover, no internal links, no FAQ", () => {
    const r = seoChecklist({ title: "x".repeat(70), seoDescription: "", body: "no links here",
      coverImageUrl: null, faqItems: [], keyTakeaways: [] });
    const ids = r.filter(c => !c.pass).map(c => c.id);
    expect(ids).toEqual(expect.arrayContaining(["title-length","meta-description","cover-image","internal-links","faq","key-takeaways"]));
  });
  it("passes a well-formed post", () => {
    const r = seoChecklist({ title: "A tight, keyword-rich flag football title",
      seoDescription: "A crisp 120-character description about flag football coaching and what it means for the women's game today.",
      body: "See our [rankings](/players) and [Italy piece](/blog/italy).", coverImageUrl: "x.jpg",
      faqItems: [{q:"?",a:"!"}], keyTakeaways: ["one","two","three"] });
    expect(r.every(c => c.pass)).toBe(true);
  });
});
```

**Step 2:** Run → FAIL. Implement:
- `slugify(title)` — lowercase, strip punctuation, collapse whitespace→`-`.
- `autoMetaDescription(bodyOrExcerpt)` — strip markdown, trim to ≤160 chars on a word boundary.
- `autoSeoTitle(title)` — trim/pad toward the 50–60 char sweet spot (return as-is if within range; note if too long).
- `keyTakeawaysSuggestion(body)` — extract the first sentence of each of the first N paragraphs (a starting point the admin edits) — the GEO-quotable summary.
- `seoChecklist(post)` — returns `{ id, label, pass, hint }[]` covering: title length (≤60), meta description present (50–160), slug set, cover image + alt, ≥1 internal link (`](/`), ≥1 FAQ item, ≥3 key takeaways, ≥1 external link with citation. Pure and deterministic.

**Step 3:** Run → PASS. Commit.
```bash
git add src/lib/blog/seo.ts src/lib/blog/seo.test.ts && git commit -m "feat: auto SEO/GEO helper + content checklist"
```

---

## Task 5: Admin blog list

**Files:** Create `src/app/admin/blog/page.tsx`; Modify `src/app/admin/AdminSidebar.tsx` (add `{ label: "Blog", href: "/admin/blog" }` to a sensible group, e.g. a new "Content" group or "Overview").

**Step 1:** Server component, `dynamic = "force-dynamic"`, `getAdminUser` gate, `createAdminClient`. List ALL `blog_posts` (draft + published + archived) with: title, category, status chip (Draft / Published / Archived), published date, author, and a live-SEO score (run `seoChecklist` → "5/8"). A prominent **"New post"** button → `/admin/blog/new`. Each row links to `/admin/blog/[id]`. Also surface the code `staticPosts` as read-only rows labeled "Code post (not editable here)" so admins see the full picture.

**Step 2:** `npx tsc --noEmit && npm run build` green (page is auth-gated — build is the gate). Commit.
```bash
git add -A && git commit -m "feat: admin blog list"
```

---

## Task 6: Admin editor + server actions

**Files:** Create `src/app/admin/blog/new/page.tsx`, `src/app/admin/blog/[id]/page.tsx`, `src/app/admin/blog/BlogEditor.tsx` (client), `src/app/admin/blog/actions.ts`.

**Step 1:** `actions.ts` (`"use server"`), each action re-checks `getAdminUser()` (bail if null), uses `createAdminClient`, `revalidatePath("/blog")` + `revalidatePath("/admin/blog")` + the specific `/blog/[slug]`:
- `createPost(input)` → inserts a draft; auto-fills `slug` via `slugify(title)` (uniqueness-checked, suffix `-2` on collision), `seo_description`/`seo_title` via the helper when blank; `created_by = admin.id`. Returns `{ ok, id }`.
- `updatePost(id, input)` → validates + updates; re-derives blank SEO fields; bumps `updated_at`.
- `publishPost(id)` / `unpublishPost(id)` / `archivePost(id)` → set `status` + `published_at` (set on first publish).
Validate: title/excerpt/body/category non-empty; slug matches `^[a-z0-9-]+$`; category is one of the existing set (reuse the Sanity schema's category list).

**Step 2:** `BlogEditor.tsx` (client) — fields: title (auto-slug preview, editable), category (select), excerpt, body (a plain `<textarea>` with a short markdown-lite cheatsheet — `**bold**`, `[text](url)`, `**Heading**` on its own line, `- bullets`), cover image (Task 7), SEO panel (Task 8), FAQ item repeater, key-takeaways repeater, guest fields (optional). A **live preview** pane rendering the body through the SAME `RichText` component so what they see matches the published page. Save / Publish / Unpublish buttons wired to the actions.

**Step 3:** `new/page.tsx` + `[id]/page.tsx` — `getAdminUser` gate, load the row (or empty for new), render `BlogEditor`.

**Step 4:** `npx tsc --noEmit && npm run build` green. Commit.
```bash
git add -A && git commit -m "feat: admin blog editor + create/update/publish actions"
```

---

## Task 7: Image upload to Supabase Storage

**Files:** Create `src/app/api/admin/blog/image/route.ts`; Modify `src/app/admin/blog/BlogEditor.tsx`.

**Step 1:** POST route — `getAdminUser` gate (401 otherwise), accept a multipart file, validate type (jpeg/png/webp) + size cap (e.g. ≤5 MB), upload to the `blog` bucket under `posts/<uuid>.<ext>` via the service-role client (reuse the approach in `src/app/api/players/[id]/photo/route.ts`), return `{ url }` (the public URL). Reject on bad type/size with a clear 400.

**Step 2:** In `BlogEditor.tsx`, add a cover-image uploader (drag/drop or file input) that calls the route and stores the returned URL in `cover_image_url`, plus a required **alt text** field (SEO/GEO + accessibility). Also add an "insert image into body" button that uploads then inserts a markdown-lite image token — NOTE: `RichText` currently has no image syntax; extend `RichText` minimally to render a standalone `![alt](url)` paragraph as a responsive `<img>` (add a tested branch), so in-body images render cohesively on the public page.

**Step 3:** Verify: in dev, upload an image in the editor, confirm the public URL loads and the cover renders on the live preview and (after publish) on `/blog/<slug>`. Confirm the `RichText` `![alt](url)` branch renders an `<img>`.

**Step 4:** `npx tsc --noEmit && npm run build` green. Commit.
```bash
git add -A && git commit -m "feat: blog image upload to Supabase Storage + in-body images"
```

---

## Task 8: SEO/GEO editor panel

**Files:** Modify `src/app/admin/blog/BlogEditor.tsx`; reuse `src/lib/blog/seo.ts`.

**Step 1:** Add a collapsible "SEO & GEO" panel showing:
- Editable `seo_title` (with a live character counter + green/red at the 50–60 band) and `seo_description` (≤160 counter), each pre-filled from the auto helper with a "Reset to auto" button.
- A **Google result preview** (title + URL + description) and an **OG/social card preview** using the cover/OG image.
- The live **checklist** from `seoChecklist(...)` — each item with pass/fail + a one-line hint (e.g. "Add at least one internal link to another post or a player/rankings page").
- **Key takeaways** repeater (the GEO summary block) pre-seeded from `keyTakeawaysSuggestion(body)`; these render on the public page as a "Key takeaways" list near the top (add that block to `blog/[slug]/page.tsx`) — quotable by AI answer engines and good for featured snippets.
- A read-only **JSON-LD preview** (Article + FAQPage) so the admin can see the structured data the post will emit.

**Step 2 (GEO discoverability):** Add `key_takeaways` rendering + ensure the post is in `sitemap.ts` and RSS (done Task 3). Optionally create/append `public/llms.txt` listing published post URLs (a lightweight GEO signal) — a small server route or build step; keep it simple.

**Step 3:** Verify the checklist reacts live as fields change; previews match the published page. Commit.
```bash
git add -A && git commit -m "feat: SEO/GEO editor panel — previews, checklist, key takeaways"
```

---

## Task 9: Internal-link suggester + related-posts backlinks

**Files:** Create `src/lib/blog/links.ts` + `links.test.ts`; Modify `src/app/admin/blog/BlogEditor.tsx`, `src/app/blog/[slug]/page.tsx`.

**Step 1 (TDD):** `suggestInternalLinks(body, { posts, players })` — pure: scans the body for mentions of existing post titles / player names not already linked, returns `{ text, href, reason }[]` suggestions (e.g. mention of "Italy" → link `/blog/italy-flag-football-global-force`; a player name → `/players/<id>`). Test: detects an unlinked mention, ignores an already-linked one, ranks exact matches first.

**Step 2:** Implement, then in the editor show a "Suggested internal links" list with one-click insert (wraps the matched text in `[text](href)`). This is the internal-linking + backlink requirement — every new post gets woven into the existing content graph.

**Step 3:** On the public detail page, add a **"Related posts"** section (same category or shared entities, 3 posts) — automatic internal backlinks in both directions. External links in bodies already get `rel="noopener noreferrer"` + `target="_blank"` via `RichText` (verify; add `rel="nofollow"` handling only if the owner wants it for affiliate/untrusted links — note as owner preference).

**Step 4:** Verify suggestions appear for a body mentioning a known post/player; related-posts renders on a published post. `npx tsc --noEmit && npm run build` green. Commit.
```bash
git add -A && git commit -m "feat: internal-link suggestions + related-posts backlinks"
```

---

## Task 10: Publish flow end-to-end + verification

**Step 1:** Full green gate:
```bash
npx tsc --noEmit && npx vitest run && npm run build
```

**Step 2:** End-to-end click-through (dev, admin-signed-in): create a post → upload a cover → write body with a heading, a bullet list, an internal link, an external link, an in-body image → fill FAQ + key takeaways → watch the SEO checklist go green → **Publish**. Then, signed-out, open `/blog` (post appears) and `/blog/<slug>` (renders through `RichText`, cover + in-body image show, Related posts show, view-source shows Article + FAQPage JSON-LD, meta title/description = the SEO fields). Unpublish → it disappears from `/blog` and 404s/410s appropriately. Confirm 375px.

**Step 3:** Confirm the safety invariants:
```sql
select policyname, cmd, qual from pg_policies where tablename='blog_posts';
-- public read policy limited to status='published'; no public insert/update/delete
```
```bash
grep -rn "blog_posts" src/app src/components | grep -vE "admin|lib/blog"
# → no cookie-client access to blog_posts outside admin/lib (drafts never leak)
```

**Step 4:** Update `CLAUDE.md` (new Active Roadmap entry: DB-backed blog authoring live, `/admin/blog`, bucket `blog`, migration `025`) and write `docs/ambra-update-2026-08-02-blog.md` explaining, in her words, how to write a post, add images, and read the SEO/GEO checklist.

**Step 5:** Finish with `superpowers:finishing-a-development-branch`.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Draft posts leak publicly | RLS public policy restricts SELECT to `status='published'`; drafts read only via service-role admin code; Task 10 grep + policy check prove it. |
| DB posts render differently from hand-written ones | They share the exact `RichText` renderer + JSON-LD path (Task 3); a live preview uses the same component. |
| Build fails when the DB is unreachable at build time | `generateStaticParams` + loaders wrap DB reads in try/catch and fall back to static posts. |
| Slug collisions between DB and static posts | `mergePostsBySlug` dedupes (DB wins); create-action suffixes duplicate slugs. |
| "Auto SEO" produces junk meta | The helper only *pre-fills*; every field is admin-editable with a "Reset to auto" and a live checklist — human stays in control. |
| Unsafe HTML from admin body | `RichText` renders a constrained markdown-lite grammar (no raw HTML), so stored bodies can't inject markup; image branch emits a plain `<img>` with the given URL/alt only. |
| GEO meant "geographic" not "generative" | Flagged in decisions; structured-data approach helps either way, and location metadata is a small add-on if confirmed. |

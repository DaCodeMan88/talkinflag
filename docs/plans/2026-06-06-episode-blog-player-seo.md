# Episode-to-Blog (Coaches & Players) + Player SEO Batch

> **For Claude:** Use `superpowers:executing-plans` to implement this plan. Work in `/Users/danielharris/Desktop/Flag/talkinflag/` on a new branch `episode-blog-seo`. Commit after every task. Build must pass before pushing.

**Goal:** (1) Convert the top podcast interviews with coaches and players into long-form blog articles with embedded video — creating SEO-indexable pages that rank on guest names. (2) Enrich every player profile page with a stronger meta title, richer description, and fuller Person JSON-LD so all 374 players are properly indexed.

**Architecture:** Static blog posts live in `src/lib/static-posts.ts` (StaticPost interface) and render at `src/app/blog/[slug]/page.tsx`. Player SEO is in `src/app/players/[id]/page.tsx` — `generateMetadata` + inline `personJsonLd` object. The `YouTubeFacade` component at `src/components/episodes/YouTubeFacade.tsx` already handles click-to-load YouTube embeds (use it in the blog template). Supabase project `wxeuybksowhncalrnttl`.

---

## Pre-flight

```bash
git checkout main && git pull origin main
git checkout -b episode-blog-seo
git status  # expect: clean tree
```

---

## PHASE 1 — Blog infrastructure for interview articles

**Goal:** Add optional `youtubeVideoId`, `guestName`, and `guestRole` fields to `StaticPost`, then update the blog page template to render a `YouTubeFacade` embed when a video ID is present.

### Task 1.1: Extend the StaticPost type

**File:** `src/lib/static-posts.ts`

Add three optional fields to the `StaticPost` interface (after `isStatic: true`):

```ts
export interface StaticPost {
  slug: string;
  title: string;
  author: string;
  publishedAt: string;
  category: string;
  excerpt: string;
  body: string;
  faqItems?: FaqItem[];
  isStatic: true;
  // Interview fields
  youtubeVideoId?: string;   // YouTube video ID (not full URL) — enables embedded player on blog page
  guestName?: string;        // e.g. "Katherine Sowers"
  guestRole?: string;        // e.g. "Head Coach, Italy Women's National Team"
}
```

### Task 1.2: Update the blog page template to embed the video

**File:** `src/app/blog/[slug]/page.tsx`

Read the file first. Then:

1. Import `YouTubeFacade` from `@/components/episodes/YouTubeFacade`.
2. After the article header (title + author + date), and before the body, add:
   ```tsx
   {post.youtubeVideoId && (
     <div className="mb-10">
       <p className="font-display text-[10px] uppercase tracking-[0.4em] text-brand-yellow mb-3">
         Watch the Episode
       </p>
       <div className="relative aspect-video border border-brand-yellow/20">
         <YouTubeFacade videoId={post.youtubeVideoId} title={post.title} />
       </div>
     </div>
   )}
   ```
3. If `post.guestName` exists, add a guest byline chip under the title:
   ```tsx
   {post.guestName && (
     <p className="text-brand-yellow font-display text-xs uppercase tracking-widest mb-6">
       Interview with {post.guestName}
       {post.guestRole ? ` — ${post.guestRole}` : ""}
     </p>
   )}
   ```

**Step 3: Verify** `npx tsc --noEmit` — expect clean.

**Step 4: Commit**
```bash
git add src/lib/static-posts.ts src/app/blog/[slug]/page.tsx
git commit -m "feat(blog): add youtubeVideoId + guestName fields to StaticPost, embed player in blog template"
```

---

## PHASE 2 — Write the 5 interview articles

**Goal:** Five long-form interview articles (coaches first, then players) added to `staticPosts` in `src/lib/static-posts.ts`. Each is ~900–1,100 words, has an embedded video placeholder, internal links, and a guest call-to-action.

> **YouTube video IDs:** The real IDs will be filled in by the owner once the YouTube API key is set. Use `youtubeVideoId: "TODO_OWNER"` as a placeholder — the embed component shows nothing if the ID is `"TODO_OWNER"` (add that guard in Task 1.2). The article text and all other fields are complete.

**Add this guard in Task 1.2 for the embed:**
```tsx
{post.youtubeVideoId && post.youtubeVideoId !== "TODO_OWNER" && (
  // ... embed
)}
```

### Article priority order

Write in this order — coaches first, then players by profile size:

| # | Slug | Guest | Role | Search angle |
|---|------|-------|------|-------------|
| 1 | `katherine-sowers-talkin-flag-interview` | Katherine Sowers | Head Coach, Italy Women's National Team | "first woman to coach in Super Bowl" |
| 2 | `amber-clark-robinson-talkin-flag-interview` | Amber Clark-Robinson | Head Coach, Univ. of Saint Mary · USA Women's Team | "college flag football coach" |
| 3 | `vanita-krouch-talkin-flag-interview` | Vanita Krouch | QB, USA Women's National Team | "best womens flag football player" |
| 4 | `darrell-doucette-talkin-flag-interview` | Darrell "Housh" Doucette III | QB, USA Men's National Team · 2024 World Championship MVP | "2024 flag football world championship" |
| 5 | `diana-flores-talkin-flag-interview` | Diana Flores | QB, Mexico Women's National Team | "diana flores flag football 2028" |

### Article format for each post

```ts
{
  slug: "katherine-sowers-talkin-flag-interview",
  title: "Katherine Sowers on Coaching Italy, Breaking Barriers, and What Flag Football Needs Next",
  author: "Talkin Flag",
  publishedAt: "2026-06-06",
  category: "Interview",
  guestName: "Katherine Sowers",
  guestRole: "Head Coach, Italy Women's National Flag Football Team",
  youtubeVideoId: "TODO_OWNER",
  excerpt: "...",  // 1-2 sentence hook
  body: `...`,    // 900–1,100 word article (see content notes below)
  isStatic: true,
}
```

### Content notes per article

Use `WebFetch` or your knowledge to verify facts before writing. Do NOT invent quotes. Write the articles in Talkin Flag's voice — direct, editorial, flag-football-fluent.

**1. Katherine Sowers**
- Fact anchor: Sowers was an offensive quality control coach for the San Francisco 49ers — the first woman to coach on-field in a Super Bowl (Super Bowl LIV, Feb 2020).
- She moved into flag football coaching, joining the Italy Women's national team program.
- Article themes: what it takes to build a national program from the outside, how NFL methodology applies to flag, women in coaching pipelines, what Italy's program does differently.
- Internal links: `/blog/italy-flag-football-global-force`, `/teams`, Italy Women's national team players in `/players`

**2. Amber Clark-Robinson**
- Fact anchor: Clark-Robinson is Head Coach at University of Saint Mary (Kansas) and a DB on the USA Women's National Team — one of the few people simultaneously coaching D1 flag and competing at the national level.
- Article themes: what D1 college flag looks like from the inside, the dual role of player-coach, recruiting high school athletes into college programs, the NAIA → D1 pipeline.
- Internal links: `/blog/flag-football-recruiting-guide-2026`, `/players` (filter: USA Women's National Team), `/teams`

**3. Vanita Krouch**
- Fact anchor: Krouch is the USA Women's starting QB. She and the team were honored at an NFL game following the 2024 World Championship win. She's a 3x IFAF World Champion (2018, 2021, 2024). From Carrollton, TX.
- Article themes: what it takes to play QB at the international level, preparing for the Olympics, being a face of the sport, the USA Women's dynasty.
- Internal links: Vanita Krouch player profile in `/players`, `/blog/usa-flag-football-national-team`, `/blog/womens-flag-football-rise`

**4. Darrell "Housh" Doucette III**
- Fact anchor: Doucette (known as "Housh") threw 6 TD passes in the 53-21 championship win over Austria at the 2024 IFAF World Championship in Lahti, Finland. He's from New Orleans, LA and plays for USA Men's National Team.
- Article themes: the mentality behind a championship-level performance, what separates a national team QB, the USA Men's program culture, playing flag football at the highest level as an adult athlete.
- Internal links: Doucette player profile in `/players`, `/blog/flag-football-positions-guide`, `/teams`

**5. Diana Flores**
- Fact anchor: Diana Flores is the QB of Mexico's Women's National Team, the #2 ranked flag football nation in the world. She's the most globally recognized flag football athlete, appeared in the Super Bowl LVII halftime show bumper and multiple NFL marketing campaigns. Plays for the Reinas de Aztecas.
- Article themes: Mexico's rise to #2 in the world, what it means to be the face of a sport going to the Olympics, growing up playing flag in Mexico, the future of international women's flag.
- Internal links: `/blog/international-flag-football-teams-to-watch-2028`, `/teams` (Mexico rankings), `/blog/flag-football-la-2028-olympics`

### After writing all 5: TypeScript check + commit

```bash
npx tsc --noEmit
git add src/lib/static-posts.ts
git commit -m "feat(blog): add 5 coach/player interview articles (Sowers, Clark-Robinson, Krouch, Doucette, Flores)"
```

---

## PHASE 3 — Player SEO batch

**Goal:** Enrich every player profile page with (a) a stronger `generateMetadata` title and description, and (b) a fuller `Person` JSON-LD block. No DB schema changes — all data comes from fields already fetched.

**File:** `src/app/players/[id]/page.tsx`

### Task 3.1: Enrich generateMetadata

**Step 1:** Add `state`, `level`, `gender`, `is_verified`, and `stats` (for `instagram`) to the metadata query so the title and description can be richer:

```ts
const { data: player } = await supabase
  .from("players")
  .select("first_name, last_name, position, level, school_or_team, country, state, gender, is_verified, instagram, stats")
  .eq("id", id)
  .single();
```

**Step 2:** Improve the title format:
```ts
// Before: "Ariana Akey | Talkin Flag Players"
// After:  "Ariana Akey — QB | Mountain Vista · CO | Talkin Flag"
const locationParts = [player.school_or_team, player.state].filter(Boolean).join(" · ");
const title = player.position
  ? `${name} — ${player.position}${locationParts ? ` | ${locationParts}` : ""} | Talkin Flag`
  : `${name}${locationParts ? ` | ${locationParts}` : ""} | Talkin Flag`;
```

**Step 3:** Improve the description to include level and verification signal:
```ts
const levelLabel: Record<string, string> = {
  high_school: "high school",
  college: "college",
  national: "national team",
  international: "international",
};
const levelStr = player.level ? levelLabel[player.level] ?? player.level : "";
const verifiedStr = player.is_verified ? " Verified athlete." : "";
const description = [
  name,
  player.position ? `${player.position}` : "",
  player.school_or_team,
  levelStr ? `${levelStr} flag football player` : "flag football player",
  "profile on Talkin Flag.",
  verifiedStr,
].filter(Boolean).join(" — ");
```

### Task 3.2: Enrich the Person JSON-LD

Replace the current minimal `personJsonLd` object (which only has name, url, jobTitle, nationality, sameAs) with a richer version:

```ts
const sameAs: string[] = [];
const instagram = player.instagram ?? (player.stats as Record<string,unknown>)?.instagram as string | undefined;
if (instagram) sameAs.push(`https://instagram.com/${instagram.replace(/^@/, "")}`);

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: fullName,
  url: `https://talkinflag.com/players/${player.id}`,
  description: description,   // reuse from generateMetadata
  sport: "Flag Football",
  ...(player.position && { jobTitle: `Flag Football ${player.position}` }),
  ...(player.country && { nationality: player.country }),
  ...(sameAs.length && { sameAs }),
  ...(player.school_or_team && {
    affiliation: {
      "@type": "Organization",
      name: player.school_or_team,
    },
  }),
  ...(player.level === "national" || player.level === "international" ? {
    memberOf: {
      "@type": "SportsTeam",
      name: player.school_or_team,
      sport: "Flag Football",
    },
  } : {}),
  knowsAbout: ["Flag Football", "Flag Football Strategy"],
};
```

**Step 3: Verify**
```bash
npx tsc --noEmit  # expect clean
```

**Step 4: Commit**
```bash
git add src/app/players/[id]/page.tsx
git commit -m "feat(seo): enrich player page generateMetadata title/description + Person JSON-LD for all 374 profiles"
```

---

## PHASE 4 — Wrap-up and deploy

**Step W.1 — Full build**
```bash
npm run build  # expect: clean
```

**Step W.2 — Update open items in CLAUDE.md**
- Mark Episode-to-Blog and Player SEO as complete
- Add owner action: supply YouTube video IDs for the 5 interview articles (fill in `youtubeVideoId` for each once `YOUTUBE_API_KEY` is live)

**Step W.3 — Push and deploy**
```bash
git push -u origin episode-blog-seo
git checkout main && git merge episode-blog-seo --no-ff
git push origin main
```

---

## Owner actions after this plan ships

- **YouTube video IDs** — once `YOUTUBE_API_KEY` is added to Vercel, the real episode IDs will be available. For each of the 5 articles, replace `youtubeVideoId: "TODO_OWNER"` with the actual YouTube video ID from the corresponding episode.
- **Spotify show ID** — unrelated to this plan but still pending.
- **Drop backup tables** — still pending if not done.

---

## Key files touched

| File | Change |
|------|--------|
| `src/lib/static-posts.ts` | Add `youtubeVideoId`, `guestName`, `guestRole` to interface; add 5 interview posts |
| `src/app/blog/[slug]/page.tsx` | Add YouTubeFacade embed + guest byline when fields present |
| `src/app/players/[id]/page.tsx` | Richer `generateMetadata` + fuller `Person` JSON-LD |

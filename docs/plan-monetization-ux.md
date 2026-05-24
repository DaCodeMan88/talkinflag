# Talkin Flag — Monetization & UX Improvement Plan

**Created:** 2026-05-24  
**Status:** Ready to execute  
**Branch:** main (execute directly)

---

## Open Items (NOT in this plan — track separately)

These are deferred until traffic/infrastructure warrants them:

- **Google AdSense** — Display ad integration (mid-article, sidebar, rankings page)
- **Newsletter CTA + email platform** (Mailchimp / Resend) — Embedded CTAs in blog posts + signup flow
- **Premium rankings / player profile features** — Paid visibility upgrades, scouting exports
- **Author bios on blog posts** — Per-author bio block at bottom of blog detail pages

---

## Task 1: Rankings — Gender Separation + Class Year Filter

**Priority:** High  
**Files:**  
- `src/types/player.ts` — add `gender` field  
- `src/components/players/PlayersFilter.tsx` — add gender toggle + grad year filter  
- `src/app/players/page.tsx` — pass gender context if needed  
- Supabase: migration to add `gender` column (`"male" | "female"`)

**Spec:**

### 1a. Supabase schema
Add a `gender` column to the `players` table:
```sql
ALTER TABLE players ADD COLUMN gender text CHECK (gender IN ('male', 'female'));
```
Update `src/types/player.ts`:
```typescript
gender?: "male" | "female" | null;
```

### 1b. Gender toggle in PlayersFilter
- Add a gender toggle at the top of the filter bar, above position pills
- Two buttons: **Men's / Boys'** and **Women's / Girls'** — with an implicit "All" (neither selected)
- Style: same pill style as position/level filters, use `bg-brand-yellow` when active
- State: `const [gender, setGender] = useState("")` — `""` = all, `"male"` or `"female"` when selected
- Filter logic: `if (gender) result = result.filter((p) => p.gender === gender)`
- Clear button clears gender too

### 1c. Class year / grad year filter
- The `grad_year` field already exists on the `Player` type and in the DB
- Derive `gradYears` from the player list (sorted ascending, non-null, distinct values)
- Show as a `<select>` dropdown (similar to the existing country dropdown) — label: "Class Year"
- Only show when `gradYears.length > 1`
- State: `const [gradYear, setGradYear] = useState("")`
- Filter logic: `if (gradYear) result = result.filter((p) => p.grad_year === Number(gradYear))`
- Include in `clearAll()` and `hasAnyFilter` check

### 1d. No gender mixing in rankings table
- When gender filter is active, the `RankingsTable` should reflect gender-scoped rankings
- The national ranking numbers shown are still the raw DB values — no recomputation needed
- Add a label above `RankingsTable` when a gender is filtered: e.g. `"Women's Rankings"` or `"Men's Rankings"`

---

## Task 2: Affiliate Links — Equipment & Kids Guide Posts

**Priority:** High  
**Files:**  
- `src/lib/static-posts.ts` — update body of two posts

**Spec:**

### 2a. `flag-football-equipment-guide` post
Add inline affiliate links using the `[link text](url)` syntax that `RichText.tsx` already renders.

Target sections to add links within:
- **Flag belts & flags** → link to a flag football belt set on Amazon
- **Cleats** → link to football cleats on Amazon
- **Cones & agility equipment** → link to sports cones on Amazon
- **Gloves** → link to receiver gloves on Amazon
- **Mouthguard** → link to mouthguards on Amazon

Use Amazon search URLs or generic product URLs as placeholders (e.g. `https://www.amazon.com/s?k=flag+football+belt+set&tag=YOURTAG-20`) — owner can swap affiliate tag once their Associates account is approved.

Add a one-line disclaimer at the bottom of the post:
> *Some links in this article are affiliate links. If you purchase through them, Talkin Flag may earn a small commission at no extra cost to you.*

### 2b. `flag-football-for-kids-parents-guide` post
Similar treatment:
- **Flag football starter kits** → Amazon link to youth flag football set
- **Youth cleats** → Amazon link
- **Hydration / water bottles** → Amazon link for sports water bottles
- **Athletic shorts/compression gear** → Amazon link

Add the same affiliate disclaimer at the bottom.

### 2c. Link format
All affiliate links open in a new tab (the `RichText` renderer already handles `target="_blank"` for `http` URLs). No additional changes needed to `RichText.tsx`.

---

## Task 3: Share Buttons on Blog Posts

**Priority:** Medium  
**Files:**  
- `src/components/blog/ShareButtons.tsx` — new client component  
- `src/app/blog/[slug]/page.tsx` — import and render near bottom of article

**Spec:**

### 3a. Create `ShareButtons` component
```tsx
"use client";
// Props: title: string, url: string
// Buttons: Twitter/X share, Copy link
```

**Twitter/X share:**
- URL: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
- Opens in `_blank`
- Icon: SVG X logo (inline, no external dependency)
- Label: "Share on X"

**Copy link:**
- Uses `navigator.clipboard.writeText(url)`
- Button text toggles: "Copy Link" → "Copied!" for 2 seconds, then resets
- State: `const [copied, setCopied] = useState(false)`

**Styling:**
- Row of 2 buttons, same border/yellow hover style as the rest of the site
- `font-display text-xs uppercase tracking-widest`
- Position: just above the "More from Blog" section (after article body and FAQ)

### 3b. Wire into `[slug]/page.tsx`
```tsx
import { ShareButtons } from "@/components/blog/ShareButtons";
// ...
<ShareButtons
  title={staticPost.title}
  url={`https://talkinflag.com/blog/${staticPost.slug}`}
/>
```

---

## Task 4: `/contact` Page

**Priority:** Medium  
**Files:**  
- `src/app/contact/page.tsx` — new page  
- `src/app/api/contact/route.ts` — optional: form submission handler (can start as static mailto fallback)

**Spec:**

### 4a. Page layout
- Matches site visual language: `bg-brand-black`, `font-display` headings, yellow accents
- Header: `h1` "Contact" in large display font
- Subtext: "Reach out about podcast features, player submissions, partnerships, or press."
- Breadcrumb JSON-LD

### 4b. Contact form fields
- **Name** (required)
- **Email** (required)
- **Subject** — dropdown options: "Podcast Feature", "Player Submission", "Partnership / Sponsorship", "Press", "Other"
- **Message** (required, textarea)
- **Submit** button

### 4c. Submission
- Phase 1 (simple): Use `mailto:` action — `action="mailto:daniel@dubsportsentertainment.com"` with `method="post"` and `enctype="text/plain"` — no backend needed
- Phase 2 (future): Replace with a Resend/SendGrid API route once email infrastructure is set up

### 4d. Navigation
- Add "Contact" link to the site nav (in `src/components/layout/Nav.tsx` or equivalent)

---

## Task 5: Blog Internal Linking Pass

**Priority:** Medium  
**Files:**  
- `src/lib/static-posts.ts` — update body text of multiple posts

**Spec:**

Systematically add `[anchor text](/blog/slug)` links between thematically related posts. The `RichText` renderer already supports this link syntax.

### Linking map (source → target)

| Source post | Add link to | Anchor text |
|---|---|---|
| `flag-football-rules-complete-guide` | `how-to-play-flag-football` | "our beginner's guide" |
| `flag-football-rules-complete-guide` | `flag-football-positions-guide` | "positions guide" |
| `how-to-play-flag-football` | `flag-football-equipment-guide` | "equipment guide" |
| `how-to-play-flag-football` | `flag-football-rules-complete-guide` | "official rules" |
| `flag-football-equipment-guide` | `flag-football-for-kids-parents-guide` | "youth players" |
| `flag-football-for-kids-parents-guide` | `how-to-find-flag-football-league` | "find a local league" |
| `how-to-coach-flag-football` | `flag-football-positions-guide` | "positions and roles" |
| `how-to-coach-flag-football` | `flag-football-film-study-guide` | "film study" |
| `flag-football-recruiting-what-scouts-want` | `flag-football-positions-guide` | "position-specific skills" |
| `flag-football-recruiting-what-scouts-want` | `visualization-mental-prep-flag-football` | "mental preparation" |
| `visualization-mental-prep-flag-football` | `flag-football-film-study-guide` | "film study" |
| `flag-football-film-study-guide` | `how-to-coach-flag-football` | "coaching fundamentals" |
| `flag-football-vs-tackle-football` | `how-to-play-flag-football` | "how flag football works" |

### Implementation note
- Add links naturally within existing paragraph text — do not force them in awkward places
- Aim for 1–2 internal links per post, not more
- Links should read naturally in context

---

## Execution Order

1. **Task 1** — Rankings filters (DB migration first, then UI)
2. **Task 2** — Affiliate links (pure content edit, no risk)
3. **Task 3** — Share buttons (small new component)
4. **Task 4** — Contact page (new route)
5. **Task 5** — Internal linking pass (content edits to static-posts.ts)

---

## Definition of Done

- [ ] Task 1: Gender toggle + class year dropdown visible on `/players`, filter logic works, no gender mixing in rankings table, TypeScript clean
- [ ] Task 2: Affiliate links present in both posts, open in new tab, disclaimer text at bottom of each post
- [ ] Task 3: Share buttons appear on all blog detail pages, copy works, X share opens correct tweet intent
- [ ] Task 4: `/contact` page renders, form fields present, submission opens mail client or hits API route
- [ ] Task 5: Internal links added per linking map, all links use correct slugs and render correctly
- [ ] `npx tsc --noEmit` passes clean
- [ ] All changes committed and pushed to `origin main`

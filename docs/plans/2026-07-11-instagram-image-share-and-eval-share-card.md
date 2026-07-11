# Instagram Image Share + Eval Archetype Share Card

**Date:** 2026-07-11
**Status:** PLANNED — not started
**Branch suggestion:** `image-share` branched from `ambra-feedback-jul11` (or from `main` AFTER that branch merges — this plan depends on `/evaluate/results` which lives on that branch, commit `feb840a`)

## Why (owner ask, from Ambra's feedback 2026-07-11)

1. Mobile profile sharing works everywhere, **but on Instagram the profile is only shareable as a DM**. She wants IG **post and/or story** sharing.
2. **Are evaluation results shareable?** They aren't today — the results view has no share button, and `/evaluate/results` is auth-gated so its URL is useless to anyone else.

### The Instagram constraint (read this first — it shapes the whole design)

Instagram has **no web API to create a post or story from a website**, and it does not accept URLs — that's why link-sharing only offers DMs. The reliable workaround: share an **image file** via `navigator.share({ files: [...] })`. When the OS share sheet receives an image (not a URL), Instagram appears with **"Post" and "Story"** destinations on both iOS and Android. So the deliverable is: render our share cards as real PNGs server-side, then share/download the file. No IG SDK, no deep links (`instagram-stories://` only works from native apps — do NOT attempt it).

## What already exists (reuse, don't rebuild)

| Thing | Where | Notes |
|---|---|---|
| Player share modal | `src/app/players/[id]/ShareCardModal.tsx` | Client component. Has native-share (URL), copy link, X, LinkedIn, embed-code. The "card" in it is an HTML mock with a "Screenshot this card to share on Instagram" note — that note is what we're replacing. Toggles: photo/school/classYear/rank + verified-only stats (height/weight/forty/vertical). |
| Player PNG renderer | `src/app/players/[id]/opengraph-image.tsx` | `ImageResponse` (next/og, edge runtime), 1200×630, service-role Supabase read gated on `is_approved`, brand design (black bg, #FDDD58 accents, grid lines, glow, photo circle). ~90% of the visual work is done here — the new routes are size/layout adaptations of it. |
| Eval results data | `eval_responses` table (fingerprint, science_rollup, archetype, role_at_submit, taken_at) + `eval_reference` (elite-ideal vector) | Everything needed for a results card is stored. `/evaluate/results` (on branch `ambra-feedback-jul11`) already reassembles it. |
| Radar math | `src/components/eval/RadarChart.tsx` | Pure SVG polar math, no library. Satori (ImageResponse) supports inline `<svg>` with polygons — port the point/polygon math into the card route. |
| Eval summary UI | `src/components/eval/PerspectiveSummary.tsx` | Client component shown after submit AND by `/evaluate/results`. This is where the eval share buttons go — one placement covers both entry points. |
| Dimension labels | `src/lib/eval/dimensions.ts` (`DIMENSION_KEYS`, `DIMENSION_LABELS`) | Use `.split(" ")[0]` short labels on the radar, same as PerspectiveSummary. |

## Hard-won gotchas the implementer MUST respect

1. **iOS user-gesture rule:** `navigator.share()` must run within the click's transient activation. `await fetch(...)` before `share()` can silently kill the share sheet on iOS Safari. **Pre-fetch the PNG blob** when the modal opens (and re-fetch, debounced ~400ms, when a toggle/format changes), cache it in state, and call `share()` synchronously with the cached file on click. If the blob isn't ready yet, fall back to download. (Same pattern already documented in `handleNativeShare`'s comment in ShareCardModal.)
2. **Satori (ImageResponse) constraints:** every `<div>` with multiple children needs explicit `display: "flex"`; no CSS grid; no external stylesheets; system `sans-serif` only unless a font is fetched (existing OG images use `fontWeight: 900` sans-serif — match that, do NOT add font loading). Inline `<svg>`/`<polygon>`/`<line>` work.
3. **Don't trust the client for verified gating.** ShareCardModal toggles arrive as query params, but the card route must re-derive which stats are verified server-side (same source the profile page uses: `stat_verifications` approved rows / the `verifiedStatKeys` logic in `src/app/players/[id]/page.tsx`) and only render a stat if BOTH the query param requests it AND it's verified. Never render unverified height/weight/forty/vertical on the image.
4. **RLS posture:** `players` and `eval_responses` are zero-policy tables — server routes must use the service-role client. The eval card route additionally needs cookie auth (`@/lib/supabase/server` `createClient` → `auth.getUser()`) FIRST, then a service/admin client for the data read, and must only ever serve **the authed user's own** latest response. Follow the pattern in `src/app/evaluate/results/page.tsx`. Mind `src/lib/supabase/usage-guard.test.ts` — it will fail the build if a cookie client touches those tables.
5. **`navigator.canShare({ files })` guard:** feature-detect file-share support (`navigator.canShare && navigator.canShare({ files: [file] })`). Desktop browsers mostly can't file-share → hide "Share Image" and show "Download" as primary there.
6. **Edge vs Node runtime:** the player card route can copy `runtime = "edge"` from opengraph-image.tsx. The eval card route reads auth cookies — use the default Node runtime (drop the `export const runtime` line) to avoid edge-cookie surprises; `ImageResponse` from `next/og` works on Node too.
7. **Image sizes:** IG post = **1080×1080**, IG story = **1080×1920**. One square image technically works for both (IG letterboxes stories), but story-native 9:16 looks dramatically better — ship both variants behind a `?format=post|story` param, default `post`.
8. **Cache headers:** add `Cache-Control: no-store` (or very short) on both routes — player toggles vary per request, and eval cards are per-user; you do NOT want a CDN caching one user's eval card for another. (Auth'd routes shouldn't be CDN-cached anyway, but be explicit.)

---

## Task 1 — Player card PNG route

**New file:** `src/app/players/[id]/card/route.tsx`

- GET route returning `ImageResponse` PNG. Query params: `format` (`post`|`story`, default `post`), `photo`, `school`, `year`, `rank`, `height`, `weight`, `forty`, `vertical` (each `1`|`0`, default matching ShareCardModal's defaults). Validate/coerce all params.
- Data load: copy the service-role read from `opengraph-image.tsx` (gated `is_approved=true`), plus whatever the profile page uses to compute `verifiedStatKeys` + `forty_yard`/`vertical_jump` from `stats`. Unknown id → 404.
- Layout: adapt the existing 1200×630 OG design to 1080×1080 and 1080×1920 (vertical: brand tag top, photo circle center ~300px, name block, position/level chips, stats row, big `talkinflag.com` watermark bottom — the image itself must carry the URL since images can't link).
- Respect gotchas 2, 3, 6, 7, 8.

**Verify:** `curl -o /tmp/card.png "localhost:3000/players/<real-id>/card?format=story"` → valid PNG at 1080×1920 (`file`/`sips -g pixelWidth`); unverified stat params ignored; bad id → 404.

## Task 2 — Shared client share-buttons component

**New file:** `src/components/share/ImageShareButtons.tsx` (client)

Props: `imageUrl: string` (card route URL incl. params), `fileName: string`, `shareTitle: string`.
- On mount and whenever `imageUrl` changes (debounce ~400ms): fetch blob → `new File([blob], fileName, { type: "image/png" })` → keep in state (gotcha 1).
- Buttons:
  - **"Share Image"** — only if `canShare({files})` (gotcha 5). Synchronous `navigator.share({ files: [cachedFile], title })` from the cached file. Catch = user cancel, no-op.
  - **"Download Card"** — always shown. `URL.createObjectURL(cachedFile)` + `<a download>` click (revoke after). Disabled state while blob is loading.
- Small helper text under buttons: "On mobile, pick Instagram in the share sheet to post to your feed or story."
- Style to match existing modal buttons (yellow primary / outlined secondary, font-display uppercase).

**Verify:** component renders; desktop shows Download only; blob refetches when imageUrl changes (network tab).

## Task 3 — Wire into ShareCardModal

**Edit:** `src/app/players/[id]/ShareCardModal.tsx`

- Add a **Post / Story** format toggle (two small segmented buttons) above the share actions.
- Build `imageUrl` = `/players/${playerId}/card?format=${format}&photo=${+showPhoto}&...` from the existing toggle state; render `<ImageShareButtons>` at the TOP of the actions column (image share is now the headline feature; link buttons stay below).
- Delete the "Screenshot this card to share on Instagram" note (line ~432) — replaced by real buttons.
- Keep every existing button (native URL share, copy, X, LinkedIn, embed) untouched.

**Verify:** local dev — modal shows new buttons, toggling "Show School" changes the downloaded PNG, Download produces the right variant. Real-phone test is an OWNER action (add to report): share sheet must show Instagram → Story/Post.

## Task 4 — Eval archetype card PNG route

**New file:** `src/app/api/eval/card/route.tsx` (Node runtime — gotcha 6)

- GET, `?format=post|story`. Auth via cookie client `auth.getUser()`; 401 if anonymous. Load the user's **latest** `eval_responses` row + `eval_reference` via the eval admin client (`src/lib/eval/admin-client.ts`), exactly like `src/app/evaluate/results/page.tsx`. 404 if no response.
- Card content (this is marketing — make it enviable, brand-black + #FDDD58):
  - "MY EVALUATION PHILOSOPHY" kicker + **archetype name** huge (reclassify blurb-free via `classifyArchetype(fingerprint)` — only the name is needed on the card).
  - **Radar SVG**: port the polar math from `RadarChart.tsx` into an inline `<svg>` (rings, spokes, elite-ideal polygon in grey, user polygon in yellow, short axis labels via `DIMENSION_LABELS[k].split(" ")[0]`). ~600px square on post, ~700px on story.
  - "Values most" top-3 list with scores (same `topN` logic as PerspectiveSummary).
  - CTA baked into the image: **"What's your eval philosophy? → talkinflag.com/evaluate"**.
  - NO user name/email on the card (it's an archetype card, keeps it privacy-clean and re-shareable).
- `Cache-Control: no-store` (gotcha 8).

**Verify:** authed browser session → `/api/eval/card` returns PNG with radar + archetype; anon curl → 401; user with no eval → 404.

## Task 5 — Share buttons on the eval summary

**Edit:** `src/components/eval/PerspectiveSummary.tsx`

- Add a share section at the bottom (below the biopsychosocial read): heading "Share your archetype", Post/Story toggle, `<ImageShareButtons imageUrl={/api/eval/card?format=…} fileName="talkin-flag-eval.png" shareTitle="My Talkin Flag evaluation archetype">`, plus a "Copy quiz link" button that copies `https://talkinflag.com/evaluate` (share the funnel, not the private results URL).
- Because PerspectiveSummary is used by BOTH the post-submit screen and `/evaluate/results`, this one edit makes results shareable everywhere.

**Verify:** take/re-view an eval locally (or hit `/evaluate/results` with a seeded session) → share section renders; desktop Download yields the archetype PNG.

## Task 6 — Readiness gate

- `npx tsc --noEmit` clean, `npx vitest run` green (149 baseline — usage-guard will catch any client mistakes), `npm run build` green.
- Local render checks per task above. Dev-server note: **new route directories 404 until the dev server restarts** (bit us on 2026-07-11 — restart before concluding a route is broken).
- Merge order: `ambra-feedback-jul11` → main first (it contains `/evaluate/results`), then this branch.
- **OWNER (Ambra real-phone) test list:** profile modal → Share Image → Instagram appears with Story + Post; story variant fills 9:16; eval summary → Share Image → same; Download works on desktop.

## Out of scope (explicitly)

- Direct IG API posting (doesn't exist for third-party web), `instagram-stories://` deep links (native-app-only), IG Graph API business publishing (requires IG business account + FB app review — revisit only if Talkin Flag wants to auto-post to ITS OWN account later).
- QR codes on cards (nice-to-have; text URL is enough for v1).
- Sharing the private `/evaluate/results` URL publicly (would need a public share-token page — not asked for).

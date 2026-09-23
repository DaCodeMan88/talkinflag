# Site Engagement, Motion & Branding 10x — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn Talkin Flag's homepage and shared UI from a mostly-static, fade-in-on-scroll site into a high-energy, video-first, motion-rich sports-media experience — borrowing the *engagement mechanics* of the Merlin reference site (autoplaying vertical video content, a floating sticky CTA, count-up stats, numbered service blocks, an FAQ accordion) while amplifying — not replacing — Talkin Flag's existing bold Anton/yellow-black broadcast identity.

**Architecture:** Add a small, dependency-free motion/utility layer (count-up hook, magnetic-hover hook, marquee/ticker component, scroll-parallax hook) consistent with the codebase's existing house style — no GSAP, no framer-motion; `globals.css` already documents "replaces GSAP timeline" / "replaces GSAP ScrollTrigger" for the current CSS-keyframe + `IntersectionObserver` approach, and this plan continues that pattern rather than introducing a new library. Add a **self-hosted** vertical video-reel strip to the homepage (new Supabase Storage bucket + admin uploader, same pattern already used for blog cover images and player photos) instead of live-pulling from Instagram, because pulling video via the Instagram/Meta Graph API requires Meta app review that a prior admin-tooling effort hit and paused on. Upgrade `Nav`, `Hero`, `Button`, `StatsBar`, `PartnersStrip`, `JoinCTA`, and the homepage teaser grids in place. Everything ships on a feature branch for owner review — nothing auto-deploys, per the project's "no autonomous publishing" rule.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Tailwind / Supabase (Postgres + Storage) / native `IntersectionObserver` + CSS + `requestAnimationFrame` (no new npm dependency) / Vitest for the logic that can be unit-tested.

---

## Design direction — read this before the task list

I looked at the Merlin site (via the screen recording you dropped in Downloads — the live editor URL redirected to merlin.site's own marketing page when I tried to open it directly, so the recording is the source of truth) and at Talkin Flag's current homepage and component code. Two things are true at once:

1. **Talkin Flag's typographic identity is already stronger than Merlin's.** Huge Anton display type, the twin hero photos flanking the wordmark, yellow-outline "FLAG" — that's a real, distinctive sports-broadcast look. Merlin's site is a generic, soft, light-gradient SaaS-template aesthetic (pill buttons, rounded cards, muted sage-green background). Copying Merlin's *visual* language down would be a downgrade.
2. **What Merlin's site does that Talkin Flag's doesn't is entirely about *engagement mechanics*, not visual style:** it's built almost 100% out of real video content (drill clips, product-in-hand shots, autoplay reels), it has a floating always-visible CTA, a visible follower count, a numbered services list, an FAQ accordion, and a playful meme post mixed into the scroll. Talkin Flag's homepage today is text, static photos, and cards that fade in — zero video anywhere on the marketing site despite the show having 11K+ Instagram followers and real drill/highlight content.

So this plan's thesis: **keep and sharpen the current black/yellow/Anton identity, and bolt on Merlin's engagement mechanics — led by real video.** That's the "10x," not a reskin.

### Two decisions I need your call on before I build

**1. Where do the homepage's autoplay video clips come from?**
Merlin's recording shows real Instagram reel content autoplaying. Talkin Flag can't live-pull video from Instagram — pulling media via the Meta Graph API requires app review, which is exactly what paused the admin Command Center's social-metrics work earlier. The workable path is: you (or Ambra) export a handful of existing reels from Instagram as `.mp4` files (Save Video → AirDrop/download — no API needed), and I build an admin uploader so Ambra can drop in new clips herself later, same pattern as the blog image uploader. I'd start with **6–8 clips** she already has (drill breakdowns, "moves to avoid getting your flag pulled," etc.) muted-autoplay-looping in a horizontal reel strip.
　→ *Do you want to go this route, or would you rather this phase wait until you have clips ready to hand off?*

**2. How far does "branding" go — logo/color system, or just motion?**
This plan keeps the current yellow (`#FDDD58`) / black / Anton system and adds a secondary accent + a subtle grain texture for depth (see Task 1). It does **not** propose a new logo, new color palette, or new typeface. If you want a deeper rebrand (new palette, new type pairing), that's a bigger, separate conversation — flag it and I'll scope that as its own plan.

I'll wait for your answers on both before touching code — the task list below assumes "yes, build the reel strip with placeholder clips you can swap" so it's ready to go the moment you say go.

---

## Task list

### Phase 0 — Motion & brand foundations

#### Task 1: Secondary accent + grain texture tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Step 1: Add a secondary accent color**

Merlin leans on one flat accent; Talkin Flag can afford a second, sparing accent for "energy" moments (live badges, hover states) without diluting the yellow. Add an electric blue pulled from nowhere invented — reuse a desaturated version of the existing `brand-gray` family so it stays monochrome-adjacent, OR (simpler, zero risk) skip a new hue entirely and rely on yellow opacity steps you already use throughout (`brand-yellow/10`, `/20`, `/30`...). **Recommendation: no new hue.** Add only a grain texture, which reads as "broadcast/film" rather than "SaaS," and costs nothing in brand risk.

```ts
// tailwind.config.ts — inside theme.extend
backgroundImage: {
  grain: "url('/grain.png')",
},
```

**Step 2: Generate a tileable grain PNG**

Use a tiny script (no new dependency) to write a 128×128 noise PNG at build time is overkill; instead generate it once and commit it:

```bash
cd /Users/danielharris/Desktop/Flag/talkinflag
node -e "
const { createCanvas } = require('canvas');
" 2>/dev/null || echo "no 'canvas' package — use the CSS noise fallback below instead"
```

Skip the PNG. Use a pure-CSS noise fallback (no asset, no dependency) — add to `globals.css`:

```css
/* Film-grain overlay: layered radial noise via CSS, no image asset. */
.grain-overlay {
  position: relative;
  isolation: isolate;
}
.grain-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.05;
  background-image:
    radial-gradient(circle at 20% 30%, #fff 0.5px, transparent 0.5px),
    radial-gradient(circle at 70% 60%, #fff 0.5px, transparent 0.5px),
    radial-gradient(circle at 40% 80%, #fff 0.5px, transparent 0.5px);
  background-size: 3px 3px, 4px 4px, 5px 5px;
  mix-blend-mode: overlay;
}
```

Drop the `tailwind.config.ts` `backgroundImage.grain` addition from Step 1 — not needed with this approach.

**Step 3: Verify**

Run: `npm run build`
Expected: build succeeds, no new warnings from the CSS.

**Step 4: Commit**

```bash
git checkout -b site-engagement-10x
git add src/app/globals.css
git commit -m "style: add reusable CSS grain-overlay utility"
```

---

#### Task 2: `useCountUp` hook

**Files:**
- Create: `src/hooks/useCountUp.ts`
- Test: `src/hooks/useCountUp.test.ts`

This powers count-up numbers in `StatsBar` (Task 10) and anywhere else a stat should animate on scroll-into-view, matching Merlin's "11,341 Followers" energy.

**Step 1: Write the failing test (pure formatting logic only — the hook itself is a thin React wrapper over `requestAnimationFrame`, so we test the extractable pure function)**

```ts
// src/hooks/useCountUp.test.ts
import { describe, it, expect } from "vitest";
import { parseCountTarget, formatCount } from "./useCountUp";

describe("parseCountTarget", () => {
  it("extracts a plain integer", () => {
    expect(parseCountTarget("75+")).toEqual({ value: 75, prefix: "", suffix: "+" });
  });

  it("extracts a value with a leading symbol", () => {
    expect(parseCountTarget("#1")).toEqual({ value: 1, prefix: "#", suffix: "" });
  });

  it("returns null for non-numeric strings so callers can skip animating them", () => {
    expect(parseCountTarget("TBD")).toBeNull();
  });
});

describe("formatCount", () => {
  it("re-applies prefix and suffix around the current animated value", () => {
    expect(formatCount(42, { value: 75, prefix: "", suffix: "+" })).toBe("42+");
    expect(formatCount(1, { value: 1, prefix: "#", suffix: "" })).toBe("#1");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useCountUp.test.ts`
Expected: FAIL — `useCountUp.ts` does not exist yet.

**Step 3: Write the implementation**

```ts
// src/hooks/useCountUp.ts
"use client";
import { useEffect, useRef, useState } from "react";

export interface CountTarget {
  value: number;
  prefix: string;
  suffix: string;
}

/** "75+" -> {value:75,prefix:"",suffix:"+"}; "#1" -> {value:1,prefix:"#",suffix:""}; "TBD" -> null. */
export function parseCountTarget(raw: string): CountTarget | null {
  const match = raw.match(/^([^\d]*)(\d+)([^\d]*)$/);
  if (!match) return null;
  return { value: Number(match[2]), prefix: match[1], suffix: match[3] };
}

export function formatCount(current: number, target: CountTarget): string {
  return `${target.prefix}${current}${target.suffix}`;
}

/**
 * Animates from 0 to the numeric value embedded in `raw` (e.g. "75+", "#1")
 * once `start` becomes true, and freezes at the literal string for anything
 * non-numeric ("TBD"). Duration in ms.
 */
export function useCountUp(raw: string, start: boolean, duration = 1200): string {
  const target = useRef(parseCountTarget(raw)).current;
  const [display, setDisplay] = useState(target ? formatCount(0, target) : raw);
  const started = useRef(false);

  useEffect(() => {
    if (!start || !target || started.current) return;
    started.current = true;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setDisplay(formatCount(target.value, target));
      return;
    }

    const startTime = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(formatCount(Math.round(eased * target.value), target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);

  return display;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useCountUp.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/hooks/useCountUp.ts src/hooks/useCountUp.test.ts
git commit -m "feat: add useCountUp hook for animated stat numbers"
```

---

#### Task 3: `Marquee` ticker component

**Files:**
- Create: `src/components/ui/Marquee.tsx`

Reusable infinite-scroll ticker — used to upgrade `PartnersStrip` (Task 11) and optionally a homepage stat/highlight ticker. Pure CSS animation (`scroll-bio`-style keyframe already exists in `tailwind.config.ts`; this adds a general-purpose one).

**Step 1: Add the keyframe**

```css
/* src/app/globals.css — alongside the existing @keyframes block */
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
```

**Step 2: Write the component**

```tsx
// src/components/ui/Marquee.tsx
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  durationSeconds?: number;
  pauseOnHover?: boolean;
}

/**
 * Infinite horizontal ticker. Pass a single row of children — this renders
 * it twice back-to-back and animates a -50% translate so the loop seams
 * invisibly. Respects prefers-reduced-motion via the global media query in
 * globals.css (animation-duration is forced to ~0 there).
 */
export function Marquee({ children, className, durationSeconds = 30, pauseOnHover = true }: MarqueeProps) {
  return (
    <div className="overflow-hidden" role="list">
      <div
        className={cn("flex w-max items-center gap-12", pauseOnHover && "hover:[animation-play-state:paused]", className)}
        style={{ animation: `marquee ${durationSeconds}s linear infinite` }}
      >
        <div className="flex items-center gap-12 shrink-0">{children}</div>
        <div className="flex items-center gap-12 shrink-0" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no new type errors.

**Step 4: Commit**

```bash
git add src/app/globals.css src/components/ui/Marquee.tsx
git commit -m "feat: add reusable Marquee ticker component"
```

---

#### Task 4: `FloatingCTA` — Merlin's sticky "Let's Talk" pill

**Files:**
- Create: `src/components/ui/FloatingCTA.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Write the component**

Shows after the hero scrolls out of view; links to `/join` (the site's real highest-intent action — "Let's Talk" doesn't map to anything on Talkin Flag, "Join" does).

```tsx
// src/components/ui/FloatingCTA.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";

export function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Link
      href="/join"
      aria-label="Join Talkin Flag"
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm px-6 py-3.5 shadow-lg shadow-black/40 transition-all duration-300 hover:scale-105 hover:bg-yellow-400 active:scale-95"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <Play size={16} fill="currentColor" />
      Join Free
    </Link>
  );
}
```

**Step 2: Mount it once, site-wide**

Read `src/app/layout.tsx` first to find the right insertion point (next to `<Nav />`/`<Footer />`), then add `<FloatingCTA />` as a sibling so it persists across route changes.

**Step 3: Verify**

Run: `npm run build`, then visually confirm in the browser (Task 16 covers full visual QA; a quick manual scroll-check here is enough to catch a crash).

**Step 4: Commit**

```bash
git add src/components/ui/FloatingCTA.tsx src/app/layout.tsx
git commit -m "feat: add site-wide floating Join CTA after hero scroll"
```

---

#### Task 5: Magnetic hover on `Button`

**Files:**
- Modify: `src/components/ui/Button.tsx`

Subtle pointer-follow translate on hover (desktop only — no-op on touch), the single highest-leverage "feels expensive" microinteraction. Keep it inline in `Button` rather than a separate hook so every existing `<Button>` call site gets it for free.

**Step 1: Add the pointer-tracking behavior**

```tsx
// src/components/ui/Button.tsx — replace the existing implementation
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, useRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, onMouseMove, onMouseLeave, ...props }, ref) => {
    const innerRef = useRef<HTMLButtonElement>(null);

    const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = innerRef.current;
      if (el && window.matchMedia("(hover: hover)").matches) {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
        el.style.transform = `translate(${x}px, ${y}px)`;
      }
      onMouseMove?.(e);
    };

    const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (innerRef.current) innerRef.current.style.transform = "";
      onMouseLeave?.(e);
    };

    return (
      <button
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className={cn(
          "inline-flex items-center justify-center font-display uppercase tracking-wider transition-[background-color,color,transform] duration-200 ease-out active:not(:disabled):scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-brand-yellow text-brand-black hover:bg-yellow-400": variant === "primary",
            "border-2 border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-brand-black": variant === "outline",
            "text-brand-yellow hover:text-yellow-400": variant === "ghost",
          },
          {
            "px-4 py-2 text-sm": size === "sm",
            "px-6 py-3 text-base": size === "md",
            "px-8 py-4 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
```

Note the `transition-[background-color,color,transform]` swap from the old `transition-all` — `transition-all` would fight the per-frame `style.transform` writes on mousemove with a 200ms easing lag; only the mouse-leave snap-back should ease.

**Step 2: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: clean. Manually hover a button in the browser (any page — Nav's "Join" or the Hero CTAs) and confirm it subtly follows the cursor, then snaps back on leave.

**Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "feat: magnetic pointer-follow hover on Button"
```

---

### Phase 1 — Nav & Hero motion

#### Task 6: Nav scroll-progress bar

**Files:**
- Modify: `src/components/layout/Nav.tsx`

A 2px yellow bar under the nav that fills with scroll depth — cheap, constant-feedback motion that reads as "alive" on every page, not just the homepage.

**Step 1: Add scroll-depth state and the bar**

In `Nav.tsx`, extend the existing scroll `useEffect` (currently only sets `scrolled`) to also compute a 0–100 percentage, then render a bar as the last child of the outer `<nav>`:

```tsx
// inside the existing scroll useEffect, replace its body:
useEffect(() => {
  const onScroll = () => {
    setScrolled(window.scrollY > 50);
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);
```

Add `const [progress, setProgress] = useState(0);` near the other `useState` calls, and right before the closing `</nav>`:

```tsx
      <div
        className="absolute bottom-0 left-0 h-[2px] bg-brand-yellow transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />
    </nav>
```

**Step 2: Verify**

Run: `npx tsc --noEmit`. Manually scroll any long page (e.g. `/players`) and confirm the bar fills smoothly.

**Step 3: Commit**

```bash
git add src/components/layout/Nav.tsx
git commit -m "feat: add scroll-progress bar to Nav"
```

---

#### Task 7: Hero scroll parallax

**Files:**
- Modify: `src/components/hero/HeroContent.tsx`

The twin photos and headline currently only animate once on load (`fadeIn`). Add a subtle parallax so they drift at different speeds as the user scrolls past the hero — this is the single most "premium" motion cue in most award-winning sites and costs one `useEffect`.

**Step 1: Add a scroll-linked transform**

```tsx
// src/components/hero/HeroContent.tsx — add near the top of the component
"use client";
import { useEffect, useRef } from "react";
// ...existing imports stay

export function HeroContent({ latestEpisode, episodeCount }: HeroContentProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const twinsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame: number;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (heroRef.current) heroRef.current.style.transform = `translateY(${y * 0.25}px)`;
        if (twinsRef.current) twinsRef.current.style.opacity = `${Math.max(0, 1 - y / 500)}`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);

  // ...existing countLabel/latestLabel/etc. logic unchanged

  return (
    <div ref={heroRef} className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">
```

And wrap the existing "Title row" `<div>` (the one with `flex items-center justify-center gap-0`) — attach `ref={twinsRef}` to it so the twins+headline fade together as the user scrolls, while the rest of the hero content (badges, subtitle, CTAs below) keeps its own independent `heroFadeUp` entrance but isn't forced to fade on scroll (only the top block should — fading the CTAs away would hide the "Watch Episodes" button while it's still the primary click target).

**Step 2: Verify**

Run: `npx tsc --noEmit && npm run build`. In the browser, scroll the homepage from the top and confirm the hero drifts/fades smoothly with no jank, and that reduced-motion (`resize_window` → emulate, or OS setting) leaves it static.

**Step 3: Commit**

```bash
git add src/components/hero/HeroContent.tsx
git commit -m "feat: add scroll parallax to Hero twins/headline"
```

---

### Phase 2 — Video-first content strip (the headline addition)

> Only start this phase once you've answered Decision 1 above. Tasks 8–10 assume self-hosted clips.

#### Task 8: `home_reel_clips` table + storage bucket

**Files:**
- Create: `supabase/migrations/028_home_reel_clips.sql`

**Step 1: Write the migration**

```sql
-- 028_home_reel_clips.sql
-- Homepage autoplay video reel strip. Separate from media_instagram_posts
-- (which embeds IG posts by shortcode on /media) because these are
-- self-hosted mp4 files Ambra uploads directly — no Instagram API involved.
create table if not exists home_reel_clips (
  id uuid primary key default gen_random_uuid(),
  video_url text not null,
  poster_url text,
  caption text not null,
  position integer not null default 0,
  is_live boolean not null default true,
  created_at timestamptz not null default now()
);

alter table home_reel_clips enable row level security;

create policy "Public can read live reel clips"
  on home_reel_clips for select
  using (is_live = true);
```

Apply it the same way prior migrations in this project were applied — via the Supabase MCP tool against the project (`wxeuybksowhncalrnttl`), not by hand in the dashboard, and only when the owner says go live (per the project's additive/no-autonomous-publish rules, applying a migration to prod is itself something to confirm first — this plan stages the SQL file; do not run `apply_migration` until Daniel explicitly says to).

**Step 2: Create the storage bucket**

Same MCP-gated caveat: create bucket `reels` (public read, mirroring the `blog` bucket) only when applying the migration, not before.

**Step 3: Commit the migration file**

```bash
git add supabase/migrations/028_home_reel_clips.sql
git commit -m "feat: add home_reel_clips table migration (not yet applied)"
```

---

#### Task 9: `getLiveReelClips` data loader

**Files:**
- Create: `src/lib/media/reels.ts`
- Test: `src/lib/media/reels.test.ts`

Mirrors the exact shape of `src/lib/media/instagram.ts` (`selectGridPosts`/`getLiveInstagramPosts`/`FALLBACK_POSTS`) so the codebase has one consistent pattern for "admin-curated live content that must never render empty."

**Step 1: Write the failing test**

```ts
// src/lib/media/reels.test.ts
import { describe, it, expect, vi } from "vitest";
import { selectLiveClips, getLiveReelClips } from "./reels";
import { createAdminClient } from "@/lib/eval/admin-client";

vi.mock("@/lib/eval/admin-client", () => ({ createAdminClient: vi.fn() }));

describe("selectLiveClips", () => {
  it("filters to is_live and sorts by position", () => {
    const rows = [
      { id: "b", is_live: true, position: 2 },
      { id: "a", is_live: true, position: 1 },
      { id: "c", is_live: false, position: 0 },
    ];
    expect(selectLiveClips(rows).map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("getLiveReelClips", () => {
  it("falls back to FALLBACK_CLIPS when the table read throws", async () => {
    vi.mocked(createAdminClient).mockImplementation(() => { throw new Error("no table"); });
    const clips = await getLiveReelClips();
    expect(clips.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/media/reels.test.ts`
Expected: FAIL — module doesn't exist.

**Step 3: Write the implementation**

```ts
// src/lib/media/reels.ts
import { createAdminClient } from "@/lib/eval/admin-client";

export interface ReelClip {
  id: string;
  video_url: string;
  poster_url: string | null;
  caption: string;
  position: number;
  is_live: boolean;
}

/**
 * Placeholder until Ambra uploads real clips via the admin uploader (Task
 * 10). Points at existing public assets so the strip never renders broken
 * video tags — swap for real drill/highlight clips once uploaded.
 */
export const FALLBACK_CLIPS: ReelClip[] = [];

export function selectLiveClips<T extends Pick<ReelClip, "is_live" | "position">>(rows: T[]): T[] {
  return rows.filter((r) => r.is_live).sort((a, b) => a.position - b.position);
}

export async function getLiveReelClips(): Promise<ReelClip[]> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("home_reel_clips")
      .select("id, video_url, poster_url, caption, position, is_live")
      .eq("is_live", true)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    const picked = selectLiveClips((data ?? []) as ReelClip[]);
    return picked.length > 0 ? picked : FALLBACK_CLIPS;
  } catch (e) {
    console.error("getLiveReelClips:", e instanceof Error ? e.message : e);
    return FALLBACK_CLIPS;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/media/reels.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/media/reels.ts src/lib/media/reels.test.ts
git commit -m "feat: add getLiveReelClips data loader with fallback"
```

---

#### Task 10: `VideoReelStrip` homepage component

**Files:**
- Create: `src/components/home/VideoReelStrip.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Write the component**

Horizontally scrollable, snap-to-card, muted-autoplay-loop videos that only play while visible (via `IntersectionObserver` — cheap and battery-friendly), tap-to-unmute per card. If `FALLBACK_CLIPS` is empty (no clips uploaded yet), the section renders nothing rather than an empty shell.

```tsx
// src/components/home/VideoReelStrip.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { ReelClip } from "@/lib/media/reels";

function ReelCard({ clip }: { clip: ReelClip }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.play().catch(() => {}); else el.pause(); },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative shrink-0 w-[220px] sm:w-[260px] aspect-[9/16] snap-center overflow-hidden bg-brand-gray border border-brand-white/10">
      <video
        ref={videoRef}
        src={clip.video_url}
        poster={clip.poster_url ?? undefined}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
      <button
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-4">
        <p className="font-display text-sm uppercase tracking-wide text-white leading-tight">{clip.caption}</p>
      </div>
    </div>
  );
}

export function VideoReelStrip({ clips }: { clips: ReelClip[] }) {
  if (clips.length === 0) return null;

  return (
    <section className="bg-brand-black py-16 border-t border-brand-white/5" aria-label="Latest reels">
      <div className="max-w-7xl mx-auto px-6 mb-6 flex items-end justify-between">
        <h2 className="font-display text-3xl md:text-5xl uppercase text-brand-white">On the Field</h2>
        <a
          href="https://instagram.com/talkinflagshow"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-yellow font-display uppercase tracking-widest text-sm hover:underline hidden md:block"
        >
          @talkinflagshow →
        </a>
      </div>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {clips.map((clip) => <ReelCard key={clip.id} clip={clip} />)}
      </div>
    </section>
  );
}
```

**Step 2: Wire into the homepage**

In `src/app/page.tsx`, import `getLiveReelClips` and `VideoReelStrip`, fetch clips alongside `episodes` (`Promise.all`), and render `<VideoReelStrip clips={clips} />` directly after `<Hero />`/`<StatsBar />` — before "Latest Episodes," so video is the first thing a visitor scrolls into, matching the Merlin recording's structure (hero → video content immediately).

**Step 3: Verify**

Run: `npx tsc --noEmit && npm run build`. Once at least one real clip is uploaded (Task 8/Decision 1), confirm in the browser: cards autoplay muted only while in view, tap unmutes, horizontal scroll snaps.

**Step 4: Commit**

```bash
git add src/components/home/VideoReelStrip.tsx src/app/page.tsx
git commit -m "feat: add homepage video reel strip"
```

---

### Phase 3 — Stats, partners, and teaser polish

#### Task 11: Wire `useCountUp` into `StatsBar`

**Files:**
- Modify: `src/components/home/StatsBar.tsx`

`StatsBar` is currently a server component (it awaits Supabase directly). Split the numbers into a small client sub-component so the server fetch stays server-side and only the animation is client-side.

**Step 1: Extract a client `StatNumber`**

```tsx
// src/components/home/StatNumber.tsx (new file)
"use client";
import { useRef, useState, useEffect } from "react";
import { useCountUp } from "@/hooks/useCountUp";

export function StatNumber({ value }: { value: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const display = useCountUp(value, inView);
  return <p ref={ref} className="font-display text-4xl md:text-5xl text-brand-black">{display}</p>;
}
```

**Step 2: Use it in `StatsBar`**

Replace the `<p className="font-display text-4xl ...">{stat.value}</p>` line inside the existing `.map` with `<StatNumber value={stat.value} />`.

**Step 3: Verify**

Run: `npx tsc --noEmit && npm run build`. Scroll to the yellow stats bar in the browser and confirm numbers count up once, on first scroll into view (not every time).

**Step 4: Commit**

```bash
git add src/components/home/StatNumber.tsx src/components/home/StatsBar.tsx
git commit -m "feat: animate StatsBar numbers with count-up on scroll"
```

---

#### Task 12: `PartnersStrip` → Marquee ticker

**Files:**
- Modify: `src/components/home/PartnersStrip.tsx`

**Step 1: Swap the static flex-wrap row for `Marquee`**

Replace the `<div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">...</div>` block with:

```tsx
import { Marquee } from "@/components/ui/Marquee";
// ...
<Marquee durationSeconds={24}>
  {PARTNERS.map((p) => (
    <a
      key={p.name}
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-display uppercase tracking-[0.2em] text-lg text-brand-white/70 hover:text-brand-yellow transition-colors whitespace-nowrap"
    >
      {p.name}
    </a>
  ))}
</Marquee>
```

Note: with only 4 partners this will look sparse looping — keep `ScrollReveal` wrapping the whole section as before, and consider this a placeholder pattern that gets more compelling as more partners are added. If it looks too empty with 4 logos, this task can ship as a no-op (keep the static row) — use judgment in the browser check below rather than forcing it.

**Step 2: Verify**

Run: `npx tsc --noEmit`. View in browser at 1440px and 375px — confirm it doesn't look worse than the static version before keeping it.

**Step 3: Commit**

```bash
git add src/components/home/PartnersStrip.tsx
git commit -m "feat: convert PartnersStrip to an infinite marquee ticker"
```

---

#### Task 13: Hover-lift on teaser cards

**Files:**
- Modify: `src/components/players/PlayerCard.tsx` (used by `PlayersSpotlight`)
- Modify: `src/components/episodes/EpisodeCard.tsx`

CSS-only (no JS tilt library, no perf cost): add a `group` hover lift + shadow + subtle scale to existing card wrappers, consistent with the existing `hover:border-brand-yellow/40`-style transitions already in the codebase.

**Step 1: Read each file first** to find its outer wrapper `className`, then add `transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40` alongside whatever border/color hover classes already exist. Do not restructure the card markup — this is a pure className addition.

**Step 2: Verify**

Run: `npx tsc --noEmit`. Hover a player card and an episode card in the browser; confirm a subtle lift, no layout shift in siblings (grid gap should absorb it).

**Step 3: Commit**

```bash
git add src/components/players/PlayerCard.tsx src/components/episodes/EpisodeCard.tsx
git commit -m "feat: add hover-lift micro-interaction to card components"
```

---

#### Task 14: `JoinCTA` grain background + magnetic button

**Files:**
- Modify: `src/components/home/JoinCTA.tsx`

**Step 1: Apply the Task 1 grain utility and switch the CTA link to `Button`**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function JoinCTA() {
  return (
    <section className="grain-overlay bg-brand-black py-20 px-6 border-t border-brand-white/5" aria-label="Join Talkin Flag">
      <div className="max-w-4xl mx-auto text-center">
        <p className="font-display text-brand-yellow text-xs uppercase tracking-[0.3em] mb-3">Free · Always</p>
        <h2 className="font-display text-4xl md:text-6xl uppercase text-brand-white mb-5">Get Discovered</h2>
        <p className="text-brand-white/50 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Join the global flag football database — visible to college coaches, scouts, and national team selectors worldwide.
        </p>
        <Link href="/join">
          <Button size="lg">Join Talkin Flag →</Button>
        </Link>
      </div>
    </section>
  );
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit && npm run build`.

**Step 3: Commit**

```bash
git add src/components/home/JoinCTA.tsx
git commit -m "feat: apply grain texture and magnetic Button to JoinCTA"
```

---

### Phase 4 — Optional stretch: FAQ accordion

#### Task 15: `Accordion` component + homepage FAQ section

**Files:**
- Create: `src/components/ui/Accordion.tsx`
- Modify: `src/app/page.tsx`

Only build this if Phases 0–3 land well and you want more Merlin-style content density. Skippable without affecting anything else in this plan.

**Step 1: Write the component**

```tsx
// src/components/ui/Accordion.tsx
"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="divide-y divide-brand-white/10 border-t border-b border-brand-white/10">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="w-full flex items-center justify-between py-5 text-left"
            >
              <span className="font-display uppercase tracking-wide text-brand-white">{item.question}</span>
              <ChevronDown size={20} className={cn("text-brand-yellow transition-transform duration-300 shrink-0", open && "rotate-180")} />
            </button>
            <div
              className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
              style={{ maxHeight: open ? "12rem" : "0", opacity: open ? 1 : 0 }}
            >
              <p className="pb-5 text-brand-white/60 leading-relaxed">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Add a homepage FAQ section**

Real, non-invented FAQ content pulled from what's already answerable from the codebase (e.g. "Is it free?", "How are rankings calculated?" → links to `/how-rankings-work`, "How do I get ranked?" → `/join`). Draft copy for owner approval rather than inventing claims — insert as a new section in `src/app/page.tsx` before `<PartnersStrip />`.

**Step 3: Verify**

Run: `npx tsc --noEmit && npm run build`. Click through each question in the browser, confirm smooth expand/collapse and correct `aria-expanded` state.

**Step 4: Commit**

```bash
git add src/components/ui/Accordion.tsx src/app/page.tsx
git commit -m "feat: add homepage FAQ accordion"
```

---

### Phase 5 — QA, verification, and handoff

#### Task 16: Full visual QA pass

**Files:** none (verification only)

**Step 1: Build and preview**

`npm run dev` has previously failed in this environment with an `EPERM: process.cwd failed … uv_cwd` spawn error (documented in `CLAUDE.md`'s Media Grid entry). Try it first; if it fails, fall back to `npm run build && npm run start` and preview the production build instead — every prior session in this repo has verified changes this way.

**Step 2: Screenshot every touched surface at three breakpoints**

Using the browser tool: homepage at 375px (mobile), 768px (tablet), 1440px (desktop). Confirm:
- Hero parallax doesn't clip or overlap the nav
- Video reel strip scrolls smoothly and doesn't break layout on mobile
- Floating CTA doesn't overlap the footer or any other fixed element (check `/join`, `/players`, and a long scroll page)
- StatsBar count-up fires once, not on every re-scroll
- Nav progress bar doesn't visually fight the existing `scrolled` background-blur transition
- Magnetic button effect is disabled (no-op) on the 375px/touch emulation — confirm via `resize_window` with the mobile preset, which also emulates touch

**Step 3: Confirm reduced-motion compliance**

The `prefers-reduced-motion` media query in `globals.css` already zeroes out `animation-duration`/`transition-duration` globally, but the new `requestAnimationFrame`-driven parallax (Task 7) and count-up (Task 2) bypass CSS entirely — both already have an explicit `prefers-reduced-motion` check in their code; re-confirm by emulating `colorScheme`/reduced-motion in the browser tool or OS settings and re-screenshotting the homepage.

**Step 4: Run the full existing test suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: all pre-existing tests still pass (499 at last count in `CLAUDE.md`, plus the new ones from Tasks 2 and 9), tsc clean.

---

#### Task 17: Branch review, not merge

**Files:** none

Per the project's hard rule ("No autonomous publishing — nothing posts, sends, or goes live without explicit human approval"), do **not** merge `site-engagement-10x` to `main` or run the Task 8 migration/storage-bucket creation without Daniel's explicit go-ahead. Push the branch, open a PR (or just hand the branch name back), and summarize:
- What changed, screenshot-by-screenshot
- That Task 8's migration is staged but **not applied**
- That Task 15 (FAQ) was built/skipped per the owner's Phase-4 call
- The exact open items from Decisions 1 and 2 above, resolved or still open

```bash
git push -u origin site-engagement-10x
```

(Do not create the PR or merge without being asked — surface the branch and let Daniel decide the next step, same as prior sessions in this repo.)

---

## Summary of new files

| File | Purpose |
|---|---|
| `src/hooks/useCountUp.ts` + test | Animated stat numbers |
| `src/components/ui/Marquee.tsx` | Infinite-scroll ticker (partners strip) |
| `src/components/ui/FloatingCTA.tsx` | Sticky "Join Free" pill after hero |
| `src/components/ui/Accordion.tsx` | FAQ accordion (Phase 4, optional) |
| `src/components/home/StatNumber.tsx` | Client sub-component wiring `useCountUp` into `StatsBar` |
| `src/components/home/VideoReelStrip.tsx` | Homepage autoplay video reel strip |
| `src/lib/media/reels.ts` + test | Data loader for `home_reel_clips`, mirrors `instagram.ts` |
| `supabase/migrations/028_home_reel_clips.sql` | New table for self-hosted reel clips (staged, not applied) |

## Summary of modified files

`tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/layout/Nav.tsx`, `src/components/hero/HeroContent.tsx`, `src/components/ui/Button.tsx`, `src/components/home/StatsBar.tsx`, `src/components/home/PartnersStrip.tsx`, `src/components/home/JoinCTA.tsx`, `src/components/players/PlayerCard.tsx`, `src/components/episodes/EpisodeCard.tsx`.

No existing feature is deleted or renamed — all changes are additive or in-place visual/interaction upgrades, per the project's additive-changes rule.

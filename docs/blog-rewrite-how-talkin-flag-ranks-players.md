# Replacement copy — /blog/how-talkin-flag-ranks-players

**For Ambra.** Paste this into `talkinflag.com/admin/blog` → open *How Talkin Flag
Ranks Players* → replace the body → **Update**. No deploy needed; live in ~5 min.

**Why it's being replaced:** the published version describes a 20/30/50-point
model (External Recognition / Measurable Performance / Comprehensive Assessment)
that the site has never actually run. The shipped algorithm is the weighted-vote
system documented at `/how-rankings-work`, verified against `src/lib/rankings/tfRank.ts`
on 2026-08-09. The old post also still says the rubric "is being finalized" and
that ranks are "provisional estimates" — both untrue since the vote system shipped.

Keep the existing slug, title and cover image. Only the body changes.

---

## Suggested SEO title

How Talkin Flag Ranks Players: The TF Rank Methodology

## Suggested meta description

TF Rank scores flag football players 0–100 using weighted input from verified
coaches, expert scouts and hosts across ten evaluation dimensions. Here's exactly
how it works.

## Key takeaways

- TF Rank is a 0–100 score built from weighted votes, not a single editor's opinion.
- Coaches carry 55% of the weight, expert scouts 30%, hosts 15%.
- A verified coach's vote can count up to twice as much, based on their Coach IQ score.
- Every player is scored on the same ten dimensions, then adjusted for how well their data is verified.
- Rankings recompute automatically every Sunday at 02:00 UTC.

---

## Body

Most player rankings come down to whoever is holding the pen. One person watches
some film, forms an opinion, and publishes a list. Flag football is growing too
fast internationally for that to hold up — no single person sees enough games
across enough countries to rank the sport honestly.

TF Rank is built the other way around. It moves the authority from one voice to a
community of verified experts, and it shows its work.

### Who is in the database

Players get into the database three ways: official rosters from USA Football,
IFAF and national federations; public indexes such as flagsonly.com; and athletes
who submit their own profiles. No invented athletes, no padding.

### Who decides what matters

Rather than us deciding which qualities make a great flag player, the people who
actually watch the games do. Coaches, expert scouts and the hosts each complete a
structured evaluation, and their answers set the weight of every ranking
dimension. The three groups blend like this:

- **Coaches — 55%.** Verified accounts with weekly exposure to live games.
- **Experts — 30%.** Professional scouts and analysts.
- **Hosts — 15%.** Ambra and Tika.

Coaches carry the most weight because they see the most football.

### Not every coach vote counts the same

Within the coaching group, each vote is multiplied by that coach's credibility —
their Coach IQ quiz score, level coached, win percentage, years of experience and
postseason record. Influence runs from a standard **1.00×** up to a capped
**2.00×**. A coach who hasn't taken the Coach IQ quiz, or who scores below the
threshold, votes at exactly 1.00×. Nobody is silenced; demonstrated knowledge
just counts for more.

### The ten dimensions

Every player is scored 0–10 on the same ten dimensions: competition level,
production, athleticism, football IQ, ball skills, defence, clutch performance,
intangibles, versatility and consistency.

Scores are derived from the stats on record, adjusted for the difficulty of the
league the player competes in — a touchdown against a national-team defence is
not a touchdown in a low-level rec league. Where a player has verified measurables
(40-yard dash, vertical jump), those are used directly. Where they don't, the
model falls back to a documented proxy rather than guessing.

### Verification changes your score

Data quality is part of the score, not an asterisk next to it:

- **Verified profile — 100%.** Stats confirmed.
- **Claimed but unverified — 85%.** The athlete owns the profile; the numbers aren't confirmed.
- **Unclaimed public record — 65%.** Built from public sources, nobody has stood behind it.

That factor multiplies the final score. Claiming and verifying your profile is
the single fastest way to move up the board — and it is free.

### The formula

    blended_weight[dim] = coaches(55%) × coach_weight[dim]
                        + experts(30%) × expert_weight[dim]
                        + hosts(15%)   × host_weight[dim]

    raw_score = Σ blended_weight[dim] × player_score[dim] / max_possible × 100
    tf_score  = raw_score × verification_factor

Players are ranked within their own cohort — high school (18U) and
college/world are separate pools — both nationally and by position.

### When it updates

Rankings recompute automatically once a week, **Sundays at 02:00 UTC**, and any
time an admin triggers a manual recompute. If you claim and verify your profile
on a Tuesday, you'll see the effect that Sunday.

### The full spec

This post is the summary. The complete, always-current methodology — including
every dimension definition and the exact weighting math — lives at
[How Rankings Work](/how-rankings-work). If the two ever disagree, that page is
the one to trust.

---

*Last reviewed: 9 August 2026.*

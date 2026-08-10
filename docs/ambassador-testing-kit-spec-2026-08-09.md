# Ambassador Testing Kit — bare minimum spec

**Status:** v0.1, basic and subject to change. **Talkin Flag retains ownership of
all testing kits.** Ambassadors are custodians, not owners — kits are issued,
logged to a named ambassador, and returned or reassigned if they step back.

---

## The design rule: build the kit backwards from the algorithm

The kit should measure what TF Rank actually consumes. Anything else is a cost
with no effect on a player's score.

Reading `src/lib/rankings/tfRank.ts`, exactly **two** camp-testable measurables
feed a score today:

| Field | Feeds | How it's used |
|---|---|---|
| `forty_yard` | `athleticism` | `(5.5 − time) × 5`, capped at 10 |
| `vertical_jump` | `athleticism` | `vertical / 4`, capped at 10 |

Everything else in the model — production, defence, clutch — comes from **game**
stats, not a testing camp. Without either measurable, the model substitutes a
proxy off competition level (`competition × 0.55`), which is a guess.

So the minimum viable kit is: **a credible 40-yard time, a credible vertical
jump, and proof of who was tested.** That's it. Three things.

### Why this is worth doing at all

Of 412 players in the database, **2 are verified.** Everyone else scores at the
85% (claimed) or 65% (unclaimed) verification factor — the score is multiplied
down. A camp that verifies 30 athletes moves them from 65% to 100%, which is the
largest single-day movement available anywhere in the system.

That is the ambassador pitch, and it's real: **camps are the only mechanism that
manufactures verified data at volume.**

---

## The kit

### 1. Timing — the one place not to cheap out

A hand-held stopwatch introduces roughly ±0.2s of human reaction error. On the
40-yard formula that is a full point of athleticism — enough to reorder a
leaderboard. If a hand-timed number carries the verified ✓ badge, the badge
stops meaning anything.

**Recommendation: wireless electronic timing gates, one pair per kit.** It is the
single most expensive item and the only one that determines whether the data is
defensible. Everything else can be improvised.

*Interim option if budget forces it:* two-timer hand timing, averaged, recorded
as **claimed (85%)** rather than verified (100%). Honest, and still better than
the 65% proxy. Do not let hand-timed numbers enter as verified.

### 2. Vertical jump

**Recommendation: wall-mounted measurement — chalk, a tape measure, and a flat
vertical surface**, with the reach height recorded alongside the jump height.
A Vertec or jump mat is nicer and faster, not meaningfully more accurate for our
purposes. Start with the cheap method; upgrade only if throughput becomes the
bottleneck.

### 3. Marking out the runway

- 50m fibreglass tape measure
- 8–10 marker cones
- Flat, dry, measured surface (any turf field or gym)

### 4. Capture and identity

- The ambassador's own phone or tablet — no hardware needed
- Talkin Flag submission form, opened on-site so results are entered while the
  athlete is standing there
- Photo of the athlete at the camp, to attach to the profile
- Signed consent form per athlete **(see flags below — do not run a camp without one)**

### 5. Branding

Talkin Flag banner or pull-up, and a small run of branded cones or bibs. Content
is half the point of the camp; it should look like a Talkin Flag event.

---

## Standard protocol (non-negotiable, or the data isn't comparable)

1. Same surface type recorded every time (turf / grass / indoor court).
2. Two 40-yard attempts, **best** recorded, both logged.
3. Three vertical attempts, **best** recorded.
4. Reach height recorded with every vertical.
5. Ambassador name, date, and location attached to every entry.
6. Nothing entered from memory after the fact — same-day entry only.

A camp that doesn't follow the protocol produces numbers that can't be compared
to any other camp, which makes them worse than no numbers at all.

---

## Budget

I have **not** priced current listings — treat the shape as guidance and get real
quotes before committing:

- Timing gates: the dominant line item, and the one that decides whether the
  programme produces verified or merely claimed data
- Vertical, tape, cones, banner: minor by comparison
- Per-kit total is effectively "the price of the timing gates, plus a bit"

**Decision to make:** how many kits in round one. My recommendation is **two** —
one with a world-team ambassador abroad and one US-based — run three or four
camps, then decide whether the data justifies scaling. Buying six kits before a
single camp has run is the expensive version of this mistake.

---

## Compliance surface — flag, do not act on without counsel

These are raised, not answered:

- **Minors.** High-school-age camps mean collecting performance data on children.
  Consent, guardian sign-off, data retention and deletion, and cross-border
  transfer if a camp runs in Europe. `Flag/visa plan/HANDOFF.md` already carries
  "jurisdiction/privacy" as an open item — this lands directly on it.
- **What ambassadors receive.** Anything of value to a college-age ambassador is
  NIL: the $600 threshold, school-specific rules, and state athlete-agent
  registration all apply. This is the strongest argument for two separate
  programmes, split by age and status rather than by prestige.
- **Non-US ambassadors.** Compensated activity in the US brings immigration
  status into scope.
- **Insurance and liability.** Timed athletic testing carries injury risk.
  Venue, waiver, and coverage need to exist before the first camp, not after.
- **E-2 investment.** Kits and camp costs may count toward Ambra's qualifying
  investment — or may thin the operating margin the marginality argument rests
  on. That is a modelling question before it is a legal one.

**Confirm with Daniel or licensed counsel before acting.**

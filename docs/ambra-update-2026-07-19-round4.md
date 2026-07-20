# Talkin Flag — Update for Ambra (July 19, 2026)

Thanks for the detailed notes. Here's what each item turned out to be and what we changed.

## 1. Tristan Cornet & "Aouellette" — these are real people, not test data

Both are genuine sign-ups from real Gmail accounts, so we did **not** delete them:

- **Tristan Cornet** (tristancornet47@gmail.com) — joined June 27. He created a login but never made a player profile. That's exactly why you couldn't approve, delete, or find him in the player screens: there's no player profile attached to his account, only the login itself. Nothing was broken.
- **Aleena Ouellette** (aouellette1013@gmail.com) — joined June 25. She *does* have a player profile (high school, Canada, currently ranked HS #20) and it's already approved and public. But she never finished the "claim" step, so her profile isn't linked to her login — which is why she looked disconnected in the members list.

**What's new for you:** the **Admin → Members** page now has a **Delete** button on each account (with a confirm step), and accounts with no player profile now clearly say **"No player profile"** instead of a blank dash. So you can manage these accounts directly from now on.

**Our recommendation:** leave both as-is — they're early real users. If you'd like, we can reach out to Aleena to help her finish claiming her profile so it links to her account.

## 2. Martika in the "World" ranks

The **World tab ranks national teams, not players.** Italy is the #8 *team* in the IFAF world rankings — that #8 belongs to the team, not to any individual.

Martika's *personal* rank is **College/World #1** — she's the top-ranked player in that cohort. She was only showing up in the World area because she's part of Italy's national roster.

To remove the confusion, the World tab now:
- Says clearly at the top that these are **team** rankings, with a link to the individual **TF Rankings**.
- Labels each expanded roster "2024 National Roster" with a note that the team's IFAF rank is separate from individual player ranks.
- Shows each rostered player's own rank next to their name (e.g. "CW #1").

## 3. Rankings now paginated (no more cut-off lists)

You were right — the site was only showing a slice of the players (about 9 of the 81 high-schoolers). Now every ranking list shows **25 players per page** with numbered page buttons at the bottom, on desktop and mobile. Click through to see 26–50, 51–75, and so on. Every player is reachable now — nothing is hidden.

This applies to the Players page and the TF Rankings page (both the High School and College/World tables).

## 4. "(18+)" label added

To match the **(18U)** on the high-school section, the college/national section is now labeled **"College / World (18+)"** everywhere it appears, so the reason for the split is clear.

---

### One small data note (no action needed)
Several Italy national-team players currently share the same rank number (a few are all tied at #25) because the ranking system doesn't have much voting data yet. That's expected for now and will spread out as more evaluations come in — it's not an error.

# Talkin Flag — Legal Risk Review (2026-07-10)

> Prepared by Claude acting in a legal-analyst capacity. **This is not legal advice from a licensed attorney.** It is a structured risk assessment to prioritize fixes and to brief real counsel efficiently. Before monetization (merch, payments, sponsorships), have an attorney — ideally one with EU/GDPR exposure — review this doc and the site.

## Executive summary

The brand's core legal exposure comes from one fact: **the site publishes personal data and derived rankings/scores about ~374 real, identifiable people — 284 of whom were scraped from flagsonly.com and never consented or were notified — including EU citizens (GDPR squarely applies) and some US high-schoolers (minors).** Layered on that, the site currently has **no privacy policy, no terms of service, and no visible correction/removal path**, while running Google OAuth (whose policies require a linked privacy policy) and collecting emails. None of this is fatal — sports statistics on public athletic performance sit on well-trodden, mostly protected ground — but the gap between "what we do" and "what we disclose" is the risk, and it is cheap to close (plan Task 8).

## Risk register (highest first)

### 1. GDPR — publishing EU athletes' data without notice (HIGH likelihood of non-compliance, MEDIUM impact today)
- The hosts and much of the roster are Italian; GB, Austria, Mexico rosters are seeded. GDPR applies to publishing EU residents' personal data regardless of where the site is hosted, because the processing targets/concerns EU data subjects.
- Height, weight, education, occupation, club, jersey, Instagram handle, photos = personal data. Some of it (e.g., height/weight of a named person) is exactly the kind of data a regulator would ask "what's your lawful basis?" about.
- **Art. 14 problem:** when personal data is NOT collected from the data subject (the 284 scraped profiles), the controller must inform the subjects of the source and their rights. Nobody was informed.
- Mitigations that genuinely help: legitimate-interest basis for sports reporting/statistics is defensible (journalism/statistics carve-outs exist in Italian implementation); the data is athletic-performance data already public elsewhere; the platform's whole model invites athletes to claim and control their profiles.
- **Do now (in plan):** privacy policy naming sources + lawful basis (Art. 14 notice by publication), visible correct/remove path on every unclaimed profile, honor erasure requests fast (`profile_reports` + admin delete already exist — document them as the mechanism).
- **Real risk today:** low regulator interest at this scale, but a single annoyed athlete emailing the Garante (Italian DPA) turns this from theoretical to real. The removal path is the pressure valve.

### 2. Accuracy / defamation-adjacent — publishing false facts about real people (MEDIUM, self-inflicted, actively being fixed)
- The stress test proved the failure mode: podcast-derived "career highlights, tournament history, stats show incorrect data and I can't edit that info" — on the founders' own profiles. If it's wrong about Ambra, it's wrong about strangers who never asked to be listed.
- False factual claims about identifiable people (wrong tournament results, fabricated caps) are the raw material of defamation/false-light claims. Sports stats rarely get litigated, but a false "cut from national team" or a wrong doping-adjacent implication would be different.
- Blog CTAs implying interviews that never happened ("the episodes that inspired this story" under a profile of someone never interviewed) is a misrepresentation/false-endorsement pattern — implies association the person didn't grant. Ambra caught this; plan Task 1 fixes it. **Rule going forward (already in CLAUDE.md): never invent quotes; never imply an interview/endorsement that didn't happen.**
- **Do now (in plan):** delete unsourced auto-derived content (Task 4/5), self-edit + verification reset (Task 3), accuracy disclaimer + report-error path in terms (Task 8).

### 3. Right of publicity — names/likenesses/stats of athletes without consent (LOW–MEDIUM, well-defended if kept editorial)
- US precedent strongly protects using athletes' names + performance stats in news/statistical products (C.B.C. Distribution v. MLBAM — fantasy sports; First Amendment). A free editorial database/rankings site is on the safe side of the line.
- The line moves when you **commercialize the identity itself**: merch with a player's name/photo, an ad featuring a specific athlete, or paid features built around a non-consenting player's profile. Italy/EU also recognize image rights more strongly than the US.
- **Rules:** merch = brand marks only (Talkin Flag), never player names/photos without a signed release. Sponsorship posts must not feature non-consenting athletes. Share-cards/OG images of unclaimed profiles are editorial and fine, but keep them stat-focused.

### 4. Minors — HS players in the database (MEDIUM impact if mishandled, contained today)
- 41 high-school players; some are minors. Publishing minors' athletic stats is common (MaxPreps does it at scale) but heightens the accuracy and removal-request obligations, and parental removal requests should be honored immediately, no questions.
- Accounts: COPPA applies under 13 — terms should set 13+ for accounts (Task 8). Recruiting features touching minors (coach contact, "coaches viewed your profile") should stay claim-gated: only athletes who opted in by claiming get recruiting visibility toggles. Verify `open to recruiting` defaults to OFF for HS players.

### 5. Scraping provenance — flagsonly.com (LOW)
- 284 profiles imported from a scrape. Facts/stats aren't copyrightable (Feist), but bios copied verbatim would be, and the source site's ToS may prohibit scraping (contract claim, weak but annoying).
- **Check:** confirm imported `bio` text was rewritten, not copied. Keep crediting conventions internal (`stats.source`) and disclose "public sources" generically in the privacy policy — naming the source in the policy (Art. 14) is the GDPR-correct move even if awkward.

### 6. Rankings, TF Rank, IQ scores — derived judgments about real people (LOW, protect as opinion)
- Rankings and scores are classic protected opinion **when the methodology is disclosed** — which /how-rankings-work already does well. Keep it that way: never present TF Rank as an objective fact ("the #8 player in the world"), frame as "our ranking."
- The verification-confidence multiplier (unclaimed = 0.65) means unconsenting athletes are systematically ranked lower — defensible, but disclose it (it's on /how-rankings-work; keep it there).
- Eval survey / Flag IQ publishing: a player's IQ badge is self-earned (they took the quiz) — consent inherent, fine.

### 7. Business structure & payments (HIGH impact if ignored, correctly already blocked)
- **Stripe is blocked on US business formation — keep it blocked.** Taking payments (merch, coach verification fees, player upgrades) as an unformed venture puts personal liability on Daniel/Ambra/Tika and makes the publicity/GDPR risks above personal. Form the entity (LLC) FIRST, then Stripe, then merch. This ordering is the single most important legal decision in the current plans and it's already right — hold the line.
- The Talkin Balls Network / Neil partnership: get the revenue/IP split and the "Network" naming license in writing before the nav rename ships. A handshake rename creates implied-partnership exposure both directions.
- Podcast: standard hygiene — music licensing on intro/outro, guest release forms (even informal email consent) for future guests, since episode content feeds the site.

### 8. Email & marketing compliance (LOW, mostly done)
- Newsletter: ensure every send has an unsubscribe link (Resend supports this; CAN-SPAM/GDPR both require it) and that the signup stores consent timestamp. Transactional emails (confirmations, approvals) are fine as built.
- Amazon Associates (paused) will require the FTC affiliate disclosure on any page with tagged links — add when unpaused.

## Process verdict on the current plans

The existing plans (stress-test audit, this Phase 2 plan) are **directionally sound from a legal standpoint** — they prioritize exactly the right things: accuracy remediation, self-edit/correction paths, and deleting unsourced content before adding more. Two adjustments now baked into the Phase 2 plan:
1. Privacy policy / terms / Art. 14 source notice / removal path (Task 8) — was missing everywhere; it's the cheapest, highest-leverage legal fix on the board.
2. Verification reset on self-edited stats (Task 3) — keeps the "verified" badge honest, which protects the brand's core trust claim from becoming a misrepresentation problem.

**Owner action list (legal):** (1) form the US entity before any Stripe/merch/paid feature; (2) written Talkin Balls/Neil agreement before the rename; (3) have a real attorney skim /privacy + /terms once drafted; (4) adopt the house rules: no invented quotes, no implied interviews, no player names/photos on merch without a release, honor removal requests within days.

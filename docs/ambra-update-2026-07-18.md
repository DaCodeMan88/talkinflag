# Update for Ambra — July 18, 2026 (DRAFT — Daniel sends)

Hey Ambra! Big update — every bug you reported turned out to be real, and they're all fixed and live after the next deploy. Here's the rundown:

**1. The "claim your profile" step that never checked off — real bug, fixed.**
The dashboard was asking the database for a column that doesn't exist, which silently broke the profile card and the Getting Started checklist for *every* user — not just you. Your claim was always fine on our side. After this deploy, your dashboard will show your "✓ Claimed" profile card and the first checklist item checked.

**2. Graduation year not saving — real bug, fixed.**
The form was silently rejecting any graduation year before 2024 (built with only current students in mind — our bad, doctorate holders exist 😄). It now accepts real years. **One action for you:** re-enter 2017 in Edit Profile → Background → Graduating Class and hit Save — it will stick this time.

**3. Roster year — now visible where you'd expect it.**
Roster year (like name/team/level) is a protected field that goes through admin review to prevent impersonation. That flow existed but was buried. Now the bottom of Edit Profile shows all five protected fields with a "Request change" button on each, and a yellow "Pending review" chip once you've submitted. Note: **you're the admin** — your own requests land in Admin → Change Requests for you or Tika to approve.

**4. The ugly Stats box on your public profile — redesigned.**
No more raw database labels like "team designation" or text spilling off the screen on phones. It now shows a clean labeled grid: Club, Jersey #, Nickname, Roster Year.

**5. Socials are now real links — and TikTok is supported.**
Instagram and TikTok show as tappable icon rows (@handle) on profiles. Add your TikTok in Edit Profile, right under Instagram.

**6. Metric units!**
In Edit Profile → Measurables there's now a FT/LBS ↔ CM/KG toggle. Enter 175 cm / 65 kg and the site displays both (5'9" / 175 cm).

**7. The admin area got a full makeover.**
- A proper sidebar (works on your phone too — hamburger menu).
- The Admin home is now a real overview: member count and growth, players/claimed/verified, evals, plus yellow "needs attention" chips for anything pending.
- New **Members** tab: every signed-up account with join date, last sign-in, linked player/coach profile, eval count, IQ score, and profile completion — searchable and filterable.
- The Players list now pages through all 412 (it was silently capped at the first 100).

**8. "Report an issue" already exists.**
Good news for your Terms draft: every profile already has a "Not you? Report this profile" button, and reports land in Admin → Reports. Your draft's wording is accurate as-is.

**9. Terms & Privacy — your July 18 edits are live,** including the age-14 minimum, the third-party content section, the full GDPR rights list (with the Garante), retention periods, and the new date.
**One open question we did NOT finalize: governing law.** Your draft says Italy/Florence, but the business license will most likely be a Texas LLC — those sections stay as-is until that decision is made (then Terms + Privacy get updated together). Also: your draft mentions a cookie banner and Cookie Policy — the site has neither yet, so the Privacy page just points to browser settings for now. Two decisions for you + Daniel: jurisdiction, and whether we build a cookie banner/policy.

One small data question while we're at it: your profile currently lists your country as "The Netherlands" with 2 caps — want us to set it to Italy, and what's the right caps number (you'd mentioned 24 at some point)?

— Daniel

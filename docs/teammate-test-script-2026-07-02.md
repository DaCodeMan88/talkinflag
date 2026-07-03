# Talkin Flag — Teammate Test Script

Send this to Ambra, Tika, and whoever else is testing this week. Nothing below needs any new code — claim/profile/photo editing was just fixed and is live on talkinflag.com.

---

**Hey team — quick favor. Can you run through this on [talkinflag.com](https://talkinflag.com) and tell us how it feels?**

1. **Sign in** at [talkinflag.com/auth/login](https://talkinflag.com/auth/login) — Google or magic-link email, no password needed.
2. **Find your profile.** Search [talkinflag.com/players](https://talkinflag.com/players) for your name.
   - **If you're found** (most national-team players already are) → open your profile → click "Is this you? Claim Profile."
   - **If you're not found** → go to [talkinflag.com/players/submit](https://talkinflag.com/players/submit) to create a profile, then search again and claim it.
3. **Fill out your profile.** From your dashboard, hit "Edit Profile" — add a bio, a photo, and your measurables.
4. **Try the fun stuff (optional but encouraged):**
   - [Athlete Evaluation](https://talkinflag.com/evaluate) — the "100-point algorithm"
   - [Flag IQ quiz](https://talkinflag.com/iq/general) — both of these feed the ranking system, so the more people who take them, the better the rankings get.
5. **Tell us what broke, what was confusing, and what you'd want that isn't there.**

Feedback channel: [however Ambra/Tika want to collect it — group chat, form, etc.]

---

## Notes for us (not for teammates)

- This validates the fix shipped 2026-07-02 (claim/profile/photo were all silently failing before — see `docs/plans/2026-07-02-fix-claim-flow-and-teammate-testing-prep.md` for the technical writeup).
- Watch `/admin/players`, `/admin/messages`, and `/admin/scouts` for anything teammates submit that needs review.
- If someone hits an actual auth hiccup (stuck on login, claim button does nothing, etc.), that's the one code path we verified at the database level but not with a live browser session — flag it immediately, don't just chalk it up to user error.

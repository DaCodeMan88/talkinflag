# Talkin Flag — the quizzes & evaluation got a big upgrade

**For:** Ambra & Coach Jon · **Date:** August 1, 2026 · From Daniel

You told me the evaluation and the quizzes felt too similar — same kind of question, same answers everyone picks, a bit boring and repetitive. You were exactly right, and the data proved it. Here's what was wrong, what's fixed, and the two small things I need from you before the biggest piece goes live.

---

## You were right — here's the proof

- **Every single evaluation question was basically the same question.** All 50 asked "how much does it matter that a player…" on a 1–5 scale. Nothing ever forced a real choice.
- **People could only really pick "very important."** Across the real evaluations taken so far, 54% of answers were the top option, and the very lowest option was *never chosen — not once.* So everyone came out looking the same, and the "evaluator type" it gave people was basically random. (One test taker who maxed out every trait got labeled a specific "type" purely because of a math quirk.)
- **The Coach IQ quiz was guessable without knowing anything.** The correct answer was "B" 88% of the time, and it was the longest answer on the list 97% of the time. Someone could score 97% just by always picking the longest answer — with zero flag football knowledge. That matters because Coach IQ is meant to influence the rankings.

## What's fixed now

**The evaluation is a completely new experience** — 28 questions instead of 50, in **five different formats** so it never feels repetitive, and it takes about 2½ minutes instead of 4:
1. **Snap Judgments** — "Two players, same stats. Who do you take?" Pick one.
2. **Spend Your Points** — 100 points to spread across traits. You can't max everything.
3. **You're on the Sideline** — real game situations; what do you want to see?
4. **Rank Them** — drag traits into your order.
5. **Where You Stand** — a few sharper opinion questions with real-language answers.

It's broken into short rounds with a quick "nice work" breather between them, so it feels like a game, not a form.

**The quizzes are fixed too:** the answers are now shuffled for every person (so "always pick B / the longest one" is dead), you get **instant feedback** after each question with the explanation (learn as you go) instead of waiting to the end, there's a streak counter, and the results now show how you compare to everyone else and which areas to brush up on.

**We can finally see completion rates.** There's a new admin page (**Admin → Assessments**) that shows, for each quiz and the evaluation: how many people start, how many finish, the completion %, and *exactly which question people quit on*. That's the number we'll watch to keep improving it.

---

## Two things I need from you 🙏

Everything above is built and tested. The improvements to the **quizzes** (shuffling, instant feedback, results) can go live as soon as we deploy. But the **new evaluation** and the **cleaned-up Coach IQ answer key** are waiting on you, on purpose — this is exactly the content you flagged, so you should approve it:

1. **Review the new 28-question evaluation.** It's written up for you in `docs/eval-bank-v2-review.md` — every question and its answers. Give it a read and tell me anything you'd change. Once you're happy, I flip it live (one command).

2. **Confirm the Coach IQ answers.** There's a new **Admin → Questions** page where you and Coach Jon can go through each quiz question, see the current "correct" answer, and approve or fix it. All 32 Coach IQ questions are marked "needs review" right now. Until they're confirmed, Coach IQ shouldn't officially count toward the rankings — this closes that out for good.

*(Nothing about the current live site changed yet — the old evaluation is still up and untouched until you sign off on the new one.)*

That's it. Reply whenever you've had a look and I'll get the new evaluation live.

— Daniel

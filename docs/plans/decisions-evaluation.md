# Evaluation / IQ / KNN Funnels — Decisions Log

Companion to `docs/plans/2026-06-07-evaluation-iq-knn-funnels.md`. Records owner-confirmed choices and the NotebookLM grounding.

## NotebookLM source
- **Notebook:** "Talkin Flag: Global Insights from the Gridiron" — `e70d736e-e7f2-4360-97b6-0948f10e16c9` (300 sources).
- **Core framework for the 100-pt algorithm:**
  - `efef5d55-de95-42f5-b836-506c611635e0` — *The Biopsychosocial Architecture of Elite Athletic Performance* (100 traits in 6 dimensions).
  - `ec49eeb7-3dc3-4a9e-ad43-5e33f1f0c7a5` — *The Biopsychosocial Ranking of Elite Athletic Performance* (1–100 traits in 6 importance tiers).
- **6 science dimensions:** S1 Cognitive Processing & Tactical Game Intelligence · S2 Visual Search/Gaze/Visuomotor · S3 Psychological Characteristics of Developing Excellence & Coping · S4 Personality / Mamba Mentality / Behavioral · S5 Neuromuscular/Contractile/Proprioceptive · S6 Physiological/Anthropometric/Autonomic Recovery.
- **6 tiers (importance):** T1 Absolute Differentiators (1–20, mental/coping) · T2 Determining Factors at the Pinnacle (21–40, cognition/tactical IQ) · T3 Behavioral Foundation (41–55) · T4 Sensorimotor Interface (56–70) · T5 Physical Execution Ceiling (71–85) · T6 Engine & Infrastructure (86–100, genetics/physiology).
- **Thesis to encode:** at the elite level, psychological/cognitive traits (T1–T2) outrank physical ones (T5–T6).

## Confirmed decisions (2026-06-07)
- **D1 — Questionnaire structure: HYBRID ✅.** 10 practical flag-football sections for fast UX; every item grounded in & citing a taxonomy trait; each fingerprint rolls up to BOTH the 10 practical buckets and the 6 science dimensions.
- **D6 — Summary shows the elite-ideal gap ✅.** Compare each member's weighting to a tier-derived reference vector and surface the largest over/under-weighting in one citation-backed line.

## Open (owner to confirm; sensible defaults in place)
- **D2 — One questionnaire for all roles, role routes influence.** Default: yes.
- **D3 — Archetypes (5):** Film-Room Evaluator, Numbers Purist, Big-Stage Believer, Athlete-First Scout, Old-School Fundamentalist. Owner may rename/add.
- **D4 — 100 item texts:** draft from the notebook (trait-cited), Ambra & Tika approve. Placeholder bank ships first.
- **D5 — Cross-role blend Coaches > Experts > Hosts:** default 55 / 30 / 15.
- **IQ answer keys:** owner verifies `correct_index` for every IQ question before it counts.
- **League-difficulty multipliers** + `level`/`team_designation` → `league_key` mapping (Phase 3).

## The 10 practical sections → science map
| # | key | name | science map |
|---|---|---|---|
| 1 | athleticism | Athleticism & Explosiveness | S5 |
| 2 | football_iq | Football IQ & Decision-Making | S1 |
| 3 | ball_skills | Ball Skills & Visuomotor | S2 |
| 4 | defense | Flag-Pulling & Defensive Technique | S1+S2+S5 |
| 5 | production | Raw Production | objective |
| 6 | competition | Competition Level | league-adjust |
| 7 | clutch | Clutch & Big-Game | S3 |
| 8 | versatility | Versatility | S1 |
| 9 | intangibles | Intangibles & Leadership | S3+S4 |
| 10 | consistency | Consistency & Durability | S6 |

-- 023_iq_question_domain.sql
-- Adds a per-question knowledge DOMAIN tag to IQ questions so results can show
-- a per-domain breakdown (e.g. rules / scheme / situational). Nullable: the
-- general Flag IQ bank has no domain in its source JSON, so those rows stay
-- null and the breakdown simply omits them. The Coach IQ source JSON already
-- carries a `domain` per question; a reseed (owner-gated) will backfill them.
alter table public.iq_questions
  add column if not exists domain text;

create index if not exists iq_questions_domain_idx on public.iq_questions(domain);

-- Phase 3 — Universal save-&-resume.
-- One generic table backs autosave for every multi-step form: IQ quizzes,
-- the evaluation runner, profile setup/edit, and the career-update form.
-- A draft is the latest in-progress payload for a (user, kind, ref) tuple;
-- it is created/updated as the user works and deleted on completion.
--
-- Consistent with the app's security posture: RLS enabled, NO policies — the
-- anon key cannot touch this table; all reads/writes go through the Next.js
-- server (/api/drafts) using the service-role key, which bypasses RLS and
-- scopes every query to the authenticated user.

CREATE TABLE IF NOT EXISTS form_drafts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,                 -- auth.users.id (owner of the draft)
  kind        text NOT NULL,                 -- quiz:coach | quiz:general | profile | eval | career_update
  ref         text NOT NULL DEFAULT '',      -- optional sub-key (e.g. player id for profile); '' when not needed
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,  -- the in-progress form payload
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref)
);

ALTER TABLE form_drafts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS form_drafts_user_idx ON form_drafts (user_id, kind, ref);

-- Phase F — Profile-Update & Career-Event Re-engagement Loop.
-- Members (players, coaches, experts) submit career updates — championship,
-- postseason, title game, role change, event covered, clinic hosted, award.
-- Admin reviews; approved updates surface on profiles (freshness signals) and,
-- for ranking-relevant achievements, make the rankings "stale" until recompute.
--
-- Consistent with the app's security posture: RLS enabled, NO policies — the
-- anon key cannot touch this table; all reads/writes go through the Next.js
-- server using the service-role key, which bypasses RLS.

CREATE TABLE IF NOT EXISTS career_updates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id uuid NOT NULL,            -- the member the update is about (auth.users.id)
  role          text NOT NULL,              -- role submitted as: 'player' | 'coach' | 'expert'
  kind          text NOT NULL,              -- championship | postseason | title_game | role_change | event_covered | clinic_hosted | award | other
  detail        jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { title, description, date, team, level, new_role, ... }
  evidence_url  text,
  status        text NOT NULL DEFAULT 'pending',     -- pending | approved | rejected
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE career_updates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS career_updates_subject_idx ON career_updates (subject_user_id, status);
CREATE INDEX IF NOT EXISTS career_updates_status_idx  ON career_updates (status, created_at DESC);
CREATE INDEX IF NOT EXISTS career_updates_reviewed_idx ON career_updates (reviewed_at DESC) WHERE status = 'approved';

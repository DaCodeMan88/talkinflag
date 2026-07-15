-- Guarded profile-field change requests. A claimed player can request a change
-- to impersonation/ranking-sensitive fields (name, team/school, level); an admin
-- approves, which writes the players column. Soft fields (position/city/country/
-- measurables/career) are self-serve via the profile PATCH route and never touch
-- this table.
--
-- Security posture (matches career_updates): RLS enabled, NO policies — anon key
-- cannot touch it; all reads/writes go through the server with the service role.

CREATE TABLE IF NOT EXISTS profile_change_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  requested_by  uuid NOT NULL,                       -- auth.users.id (must equal players.claimed_by)
  field         text NOT NULL,                       -- first_name | last_name | school_or_team | level
  old_value     text,
  new_value     text NOT NULL,
  status        text NOT NULL DEFAULT 'pending',     -- pending | approved | rejected
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profile_change_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS pcr_player_idx ON profile_change_requests (player_id, status);
CREATE INDEX IF NOT EXISTS pcr_status_idx ON profile_change_requests (status, created_at DESC);

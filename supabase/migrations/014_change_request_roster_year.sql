-- Allow athletes to request a correction to their national roster_year via the
-- guarded change-request flow. roster_year lives in the players.stats JSONB
-- blob (applied by the admin approve route, not written as a column), but the
-- change-request row still records field='roster_year', so the DB-layer enum
-- guard must permit it alongside the existing top-level identity fields.

ALTER TABLE profile_change_requests
  DROP CONSTRAINT IF EXISTS profile_change_requests_field_check;

ALTER TABLE profile_change_requests
  ADD CONSTRAINT profile_change_requests_field_check
  CHECK (field IN ('first_name', 'last_name', 'school_or_team', 'level', 'roster_year'));

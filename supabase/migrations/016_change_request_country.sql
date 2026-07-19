-- Nationality (country) drives public representation claims (flag, "X National
-- Team" matching, JSON-LD nationality) and was incorrectly classified as a
-- self-editable "soft" field alongside city. Unlike city (pure residence,
-- cosmetic), country needs the same impersonation/accuracy governance as
-- team/level/roster_year: self-editing it can desync a player's stated
-- nationality from their guarded team/country_code without any review.
ALTER TABLE profile_change_requests
  DROP CONSTRAINT IF EXISTS profile_change_requests_field_check;

ALTER TABLE profile_change_requests
  ADD CONSTRAINT profile_change_requests_field_check
  CHECK (field IN ('first_name', 'last_name', 'school_or_team', 'level', 'roster_year', 'country'));

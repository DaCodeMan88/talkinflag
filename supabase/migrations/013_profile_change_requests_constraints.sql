-- Defense-in-depth for profile_change_requests: this table is the trust
-- boundary for impersonation/ranking-sensitive field edits, so enum values
-- and reviewer/requester identities should be enforced at the DB layer, not
-- solely by app code (sanitizeChangeRequest / the approve-reject routes).

ALTER TABLE profile_change_requests
  ADD CONSTRAINT profile_change_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE profile_change_requests
  ADD CONSTRAINT profile_change_requests_field_check
  CHECK (field IN ('first_name', 'last_name', 'school_or_team', 'level'));

ALTER TABLE profile_change_requests
  ADD CONSTRAINT profile_change_requests_requested_by_fkey
  FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE profile_change_requests
  ADD CONSTRAINT profile_change_requests_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Question authoring/review metadata. Applied to wxeuybksowhncalrnttl via
-- Supabase MCP 2026-08-01. Lets admins (Ambra + Coach Jon) confirm each answer
-- key — the owner action open since 2026-06-25 for the Coach IQ bank — and
-- fix a bad question without a deploy.
ALTER TABLE iq_questions
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_note TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','approved','retired'));

ALTER TABLE eval_items
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

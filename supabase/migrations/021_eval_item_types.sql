-- Typed evaluation items. Applied to wxeuybksowhncalrnttl via Supabase MCP 2026-08-01.
-- `style` (importance|tradeoff) is superseded but kept so existing rows and the
-- v1 seed remain valid. Every existing v1 item is a Likert importance item, so
-- the item_type default covers them with no backfill.
ALTER TABLE eval_items
  ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'likert'
    CHECK (item_type IN ('likert','forced_choice','budget','rank','scenario')),
  ADD COLUMN IF NOT EXISTS context TEXT,        -- scenario vignette / setup text
  ADD COLUMN IF NOT EXISTS round INTEGER;       -- chunk number for checkpoints

CREATE INDEX IF NOT EXISTS idx_eval_items_round ON eval_items(questionnaire_id, round, ordinal);

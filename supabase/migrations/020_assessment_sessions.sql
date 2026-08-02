-- Assessment telemetry + tamper-proof shuffle spine.
-- Applied to project wxeuybksowhncalrnttl via Supabase MCP on 2026-08-01.
-- Serves BOTH the eval questionnaire and the IQ quizzes.
-- `nonce` is server-only: the client sends a session id, never a permutation.

CREATE TABLE IF NOT EXISTS assessment_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('eval','iq')),
  subject_key TEXT NOT NULL,              -- eval: questionnaire id · iq: category
  nonce TEXT NOT NULL,                    -- server-only shuffle seed
  total_items INTEGER NOT NULL,
  answered_count INTEGER NOT NULL DEFAULT 0,
  last_index INTEGER NOT NULL DEFAULT 0,  -- furthest question reached (drop-off point)
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,               -- NULL = not finished
  nudged_at TIMESTAMPTZ,                  -- set when the abandon email fires (Task 21)
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user ON assessment_sessions(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_open
  ON assessment_sessions(kind, completed_at, last_seen_at) WHERE completed_at IS NULL;

CREATE TABLE IF NOT EXISTS assessment_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('start','answer','back','resume','checkpoint','complete')),
  item_index INTEGER,                     -- 0-based position in the run
  item_id UUID,                           -- eval_items.id / iq_questions.id
  correct BOOLEAN,                        -- iq only; NULL for eval
  ms_on_item INTEGER,                     -- time spent before answering
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assessment_events_session ON assessment_events(session_id, id);
CREATE INDEX IF NOT EXISTS idx_assessment_events_item ON assessment_events(item_id, type);

-- Service-role only (matches eval_items / iq_questions): the nonce must never
-- reach a browser, and per-item difficulty stats are not public.
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_events   ENABLE ROW LEVEL SECURITY;

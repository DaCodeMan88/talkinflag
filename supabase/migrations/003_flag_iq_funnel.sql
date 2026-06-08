-- Flag Football IQ funnel. Applied to wxeuybksowhncalrnttl via Supabase MCP 2026-06-07.
-- Questions sourced (evergreen) from the "Talkin Flag: Global Insights from the Gridiron" NotebookLM.

CREATE TABLE IF NOT EXISTS iq_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('host','coach','expert','player','general')),
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (category, version)
);

CREATE TABLE IF NOT EXISTS iq_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES iq_quizzes(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_index INTEGER NOT NULL,     -- answer key — NOT public
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  source_citation TEXT,
  UNIQUE (quiz_id, ordinal)
);

CREATE TABLE IF NOT EXISTS iq_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES iq_quizzes(id),
  category TEXT NOT NULL,
  score_raw INTEGER NOT NULL,
  score_max INTEGER NOT NULL,
  score_pct NUMERIC(5,2) NOT NULL,
  answers JSONB NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iq_attempts_user ON iq_attempts(user_id, category);

CREATE OR REPLACE VIEW iq_best WITH (security_invoker = true) AS
SELECT DISTINCT ON (user_id, category)
  user_id, category, score_pct, taken_at
FROM iq_attempts
ORDER BY user_id, category, score_pct DESC, taken_at DESC;

ALTER TABLE iq_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE iq_questions ENABLE ROW LEVEL SECURITY;   -- no public policy: answer key server-side
ALTER TABLE iq_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY iq_quizzes_read ON iq_quizzes FOR SELECT USING (true);
CREATE POLICY iq_attempts_select_own ON iq_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY iq_attempts_insert_own ON iq_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

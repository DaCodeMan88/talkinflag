-- Evaluation Philosophy funnel (the "100-point algorithm").
-- Applied to project wxeuybksowhncalrnttl via Supabase MCP on 2026-06-07.
-- Grounded in the "Talkin Flag: Global Insights from the Gridiron" NotebookLM
-- (Biopsychosocial Architecture of Elite Athletic Performance — 100 traits / 6 dims).

CREATE TABLE IF NOT EXISTS member_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host','coach','expert','player')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS eval_dimensions (
  key TEXT PRIMARY KEY,
  ordinal INTEGER NOT NULL,
  name TEXT NOT NULL,
  science_dimension TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS eval_questionnaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (version)
);

CREATE TABLE IF NOT EXISTS eval_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES eval_questionnaires(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL REFERENCES eval_dimensions(key),
  ordinal INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,                 -- [{label, dimension, points}] — answer key, NOT public
  style TEXT NOT NULL DEFAULT 'importance' CHECK (style IN ('importance','tradeoff')),
  science_dimension TEXT,
  taxonomy_trait_id INTEGER,
  taxonomy_tier INTEGER,
  source_citation TEXT,
  UNIQUE (questionnaire_id, ordinal)
);

CREATE TABLE IF NOT EXISTS eval_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES eval_questionnaires(id),
  role_at_submit TEXT NOT NULL CHECK (role_at_submit IN ('host','coach','expert','player')),
  answers JSONB NOT NULL,
  fingerprint JSONB NOT NULL,
  science_rollup JSONB,
  archetype TEXT NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eval_responses_user ON eval_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_eval_responses_role ON eval_responses(role_at_submit);

CREATE TABLE IF NOT EXISTS ranking_weights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,               -- e.g. 'dim.coach.football_iq'
  value NUMERIC(8,3) NOT NULL,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'aggregate' CHECK (source IN ('aggregate','admin')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eval_reference (
  key TEXT PRIMARY KEY,                   -- 'dim.*' | 'sci.*' (taxonomy elite-ideal)
  value NUMERIC(6,3) NOT NULL,
  description TEXT
);

-- RLS
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_items ENABLE ROW LEVEL SECURITY;          -- no public policy: answer key stays server-side
ALTER TABLE eval_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY member_roles_select_own ON member_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY member_roles_insert_own ON member_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY eval_dimensions_read ON eval_dimensions FOR SELECT USING (true);
CREATE POLICY eval_questionnaires_read ON eval_questionnaires FOR SELECT USING (true);
CREATE POLICY ranking_weights_read ON ranking_weights FOR SELECT USING (true);
CREATE POLICY eval_reference_read ON eval_reference FOR SELECT USING (true);
CREATE POLICY eval_responses_select_own ON eval_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY eval_responses_insert_own ON eval_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

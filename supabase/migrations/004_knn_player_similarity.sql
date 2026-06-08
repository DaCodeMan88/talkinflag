-- KNN player similarity (pgvector, league-adjusted). Applied to wxeuybksowhncalrnttl
-- via Supabase MCP 2026-06-07. Vectors built by scripts/build-player-vectors.ts.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS league_difficulty (
  league_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  difficulty NUMERIC(4,3) NOT NULL,
  notes TEXT
);
INSERT INTO league_difficulty (league_key, label, difficulty, notes) VALUES
  ('usa_national',  'USA National / Olympic', 1.300, 'Top of the global pyramid'),
  ('intl_national', 'International National Teams', 1.150, 'IFAF national-team level outside USA'),
  ('us_college',    'US College', 0.950, 'NAIA/NJCAA/sanctioned college'),
  ('us_hs',         'US High School', 0.700, 'Sanctioned high-school flag'),
  ('other',         'Other / Unclassified', 0.800, 'Fallback')
ON CONFLICT (league_key) DO NOTHING;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS league_key TEXT,
  ADD COLUMN IF NOT EXISTS profile_vector vector(10),
  ADD COLUMN IF NOT EXISTS profile_built_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_players_profile_vec
  ON players USING hnsw (profile_vector vector_l2_ops);

ALTER TABLE league_difficulty ENABLE ROW LEVEL SECURITY;
CREATE POLICY league_difficulty_read ON league_difficulty FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION similar_players(target UUID, k INTEGER DEFAULT 8)
RETURNS TABLE(id UUID, distance DOUBLE PRECISION)
LANGUAGE sql STABLE AS $$
  SELECT p.id, (p.profile_vector <-> t.profile_vector) AS distance
  FROM players p,
       (SELECT profile_vector, gender FROM players WHERE id = target) t
  WHERE p.id <> target
    AND p.profile_vector IS NOT NULL
    AND t.profile_vector IS NOT NULL
    AND (p.gender IS NOT DISTINCT FROM t.gender)
  ORDER BY p.profile_vector <-> t.profile_vector
  LIMIT k;
$$;
GRANT EXECUTE ON FUNCTION similar_players(UUID, INTEGER) TO anon, authenticated;

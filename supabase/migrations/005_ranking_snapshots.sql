-- Ranking snapshots + pg_cron nightly recompute.
-- Applied to project wxeuybksowhncalrnttl via Supabase MCP.

-- History table — one row per player per recompute run
CREATE TABLE IF NOT EXISTS ranking_snapshots (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  ranking_national  INTEGER NOT NULL,
  ranking_position  INTEGER NOT NULL,
  tf_score          NUMERIC(5,1) NOT NULL,
  position_bucket   TEXT NOT NULL,
  dim_scores        JSONB,
  verification_factor NUMERIC(4,2),
  snapshotted_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_player    ON ranking_snapshots(player_id);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_snapshotted ON ranking_snapshots(snapshotted_at DESC);

ALTER TABLE ranking_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY ranking_snapshots_read ON ranking_snapshots FOR SELECT USING (true);

-- pg_cron: nightly recompute at 02:00 UTC
-- Calls the Next.js recompute API with the cron secret.
-- The job is created only when pg_cron is available (Supabase Pro+).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'tf-rank-nightly',
      '0 2 * * *',
      $$
        SELECT net.http_post(
          url := current_setting('app.settings.site_url', true) || '/api/admin/recompute-rankings',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
          ),
          body := '{}'::jsonb
        );
      $$
    );
  END IF;
END;
$$;

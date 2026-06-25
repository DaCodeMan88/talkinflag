-- Switch TF Rank recompute from nightly to WEEKLY.
-- Decision (2026-06-25): rankings are released once a week, not nightly.
-- Reschedules the pg_cron job to Sundays at 02:00 UTC (7h before the Sunday
-- 09:00 UTC weekly digest in vercel.json, so the digest reflects fresh ranks).
-- Only runs when pg_cron is available (Supabase Pro+). On the current stack the
-- working weekly trigger is the Vercel cron in vercel.json hitting
-- /api/admin/recompute-rankings; this migration keeps the DB path correct for
-- whenever pg_cron is enabled.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Drop the old nightly job if it exists.
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'tf-rank-nightly') THEN
      PERFORM cron.unschedule('tf-rank-nightly');
    END IF;
    -- Replace any prior weekly job before (re)creating it.
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'tf-rank-weekly') THEN
      PERFORM cron.unschedule('tf-rank-weekly');
    END IF;
    PERFORM cron.schedule(
      'tf-rank-weekly',
      '0 2 * * 0',
      $job$
        SELECT net.http_post(
          url := current_setting('app.settings.site_url', true) || '/api/admin/recompute-rankings',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
          ),
          body := '{}'::jsonb
        );
      $job$
    );
  END IF;
END;
$$;

-- Admin-curated Instagram grid for /media. Replaces the hardcoded
-- INSTAGRAM_POSTS array in src/app/media/page.tsx (kept in
-- src/lib/media/instagram.ts as FALLBACK_POSTS).
-- Exactly 9 rows are shown live; retired reels stay as is_live = false.
--
-- NOT YET APPLIED TO PRODUCTION. Owner decision 2026-09-14 (Daniel): write the
-- file, review the SQL, apply later. Until it is applied, /media renders
-- FALLBACK_POSTS, which is byte-identical to the seed below.
CREATE TABLE IF NOT EXISTS media_instagram_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shortcode TEXT UNIQUE NOT NULL,           -- e.g. 'DKULB7cNxpR'
  label TEXT NOT NULL DEFAULT '',           -- admin-facing note, e.g. 'Most popular · 20.4K likes'
  position INT NOT NULL DEFAULT 0,          -- 0-8 left-to-right in the 3x3 grid
  is_live BOOLEAN NOT NULL DEFAULT TRUE,    -- false = retired, kept for re-use
  -- Performance numbers Ambra reads off Instagram Insights by hand. No API can
  -- fill these without Meta App Review (see docs/plans/2026-08-07-admin-command-center.md).
  plays INT,
  likes INT,
  metrics_captured_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_ig_live_pos ON media_instagram_posts(is_live, position);

ALTER TABLE media_instagram_posts ENABLE ROW LEVEL SECURITY;
-- Public may read only live rows; every write goes through the service-role
-- client in admin code, never the cookie client.
CREATE POLICY media_instagram_posts_public_read ON media_instagram_posts
  FOR SELECT USING (is_live = TRUE);

-- Seed with the 9 shortcodes currently hardcoded, in their current order, so
-- /media renders identically the moment this ships.
INSERT INTO media_instagram_posts (shortcode, label, position) VALUES
  ('DKULB7cNxpR', 'Most popular · 20.4K likes',        0),
  ('DHHVMyKN9Qw', 'Popular · 8.5K likes',              1),
  ('DZIWIHgt8bq', 'Fiesta Bowl Flag Football Classic', 2),
  ('DY2T9iytnox', 'Flag football is already here',     3),
  ('DZNRMgSDZOs', 'S3 Episode 20 · EFAF',              4),
  ('DZFuHE0jdPw', 'Brazil Nation Spotlight',           5),
  ('DZAmA5TDc5e', 'Athletes & coaches',                6),
  ('DY7WHrhDdm5', 'S3 Episode 19 · Fiesta Bowl',       7),
  ('DYztBlcDcBL', 'Jamaica Nation Spotlight',          8)
ON CONFLICT (shortcode) DO NOTHING;

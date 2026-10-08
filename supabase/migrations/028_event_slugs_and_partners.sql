-- Two changes from the September 2026 Search Console review (Dub vault:
-- Flag/docs/reports/2026-09-search-report.md).
--
-- 1. events.slug — readable event URLs (/events/european-flag-football-championship-2026
--    instead of /events/<uuid>). Old UUID URLs keep working: the page 301s them
--    to the slug, so links Google already holds are not lost.
-- 2. partners — the homepage partner strip moves out of code so Ambra can add,
--    remove and reorder partners from /admin/partners without a deploy.

-- ── 1. Event slugs ──────────────────────────────────────────────────────────

ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT;

-- Mirrors slugify() in src/lib/blog/seo.ts: lowercase, strip diacritics and
-- apostrophes, collapse every other non-alphanumeric run to one dash.
CREATE OR REPLACE FUNCTION event_slug_base(title TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(
    NULLIF(
      trim(BOTH '-' FROM regexp_replace(
        regexp_replace(lower(translate(title,
          'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÑñÇçÝýÿ',
          'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCcYyy')),
          '[''’]', '', 'g'),
        '[^a-z0-9]+', '-', 'g')),
      ''),
    'event')
$$;

-- Unique slug for a title: base, then base-2, base-3 ... skipping `self_id`.
CREATE OR REPLACE FUNCTION event_unique_slug(title TEXT, self_id UUID) RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  base TEXT := event_slug_base(title);
  candidate TEXT := base;
  n INT := 1;
BEGIN
  WHILE EXISTS (SELECT 1 FROM events WHERE slug = candidate AND id IS DISTINCT FROM self_id) LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Backfill in a stable order so the oldest event keeps the bare slug.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, title FROM events WHERE slug IS NULL ORDER BY start_date, created_at LOOP
    UPDATE events SET slug = event_unique_slug(r.title, r.id) WHERE id = r.id;
  END LOOP;
END $$;

-- New submissions get a slug automatically. A slug is never changed by a
-- title edit afterwards: changing it would break every link already shared.
CREATE OR REPLACE FUNCTION events_set_slug() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := event_unique_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_set_slug ON events;
CREATE TRIGGER events_set_slug BEFORE INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION events_set_slug();

ALTER TABLE events ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- ── 2. Partners ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL CHECK (url ~ '^https?://'),
  position INT NOT NULL DEFAULT 0,
  is_live BOOLEAN NOT NULL DEFAULT TRUE,   -- false = hidden, kept for re-use
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partners_live_pos ON partners(is_live, position);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
-- Same pattern as media_instagram_posts: public read goes through the
-- service-role client; this policy is defense in depth.
CREATE POLICY partners_public_read ON partners FOR SELECT USING (is_live = TRUE);

-- Seed with the hardcoded list. Athleads is seeded hidden, not deleted:
-- Ambra 2026-10-07, "the partnership kinda faded."
INSERT INTO partners (name, url, position, is_live) VALUES
  ('Flag Football Finder',          'https://flagfootballfinder.com',                          0, TRUE),
  ('Flag Football Nation',          'https://www.instagram.com/flagfootballnationofficial/',   1, TRUE),
  ('Women''s College Flag Football', 'https://www.womenscollegeflagfootball.com',              2, TRUE),
  ('Athleads',                      'https://athleads.com',                                    3, FALSE);

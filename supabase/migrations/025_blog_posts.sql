-- Admin-authored blog posts. A third source alongside code staticPosts + Sanity.
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Talkin Flag',
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,                       -- markdown-lite (same shape as staticPosts.body)
  cover_image_url TEXT,
  cover_image_alt TEXT,
  -- SEO/GEO
  seo_title TEXT,                           -- <title>/OG title override; falls back to title
  seo_description TEXT,                      -- meta description; falls back to excerpt
  og_image_url TEXT,                         -- social card; falls back to cover_image_url
  key_takeaways JSONB DEFAULT '[]'::jsonb,   -- string[] — the GEO-quotable summary bullets
  faq_items JSONB DEFAULT '[]'::jsonb,       -- [{q,a}] → FAQPage JSON-LD
  -- lifecycle
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_pub ON blog_posts(status, published_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
-- Public may read ONLY published posts; all writes + draft reads go through the
-- service-role client in admin code (never the cookie client).
CREATE POLICY blog_posts_public_read ON blog_posts
  FOR SELECT USING (status = 'published');

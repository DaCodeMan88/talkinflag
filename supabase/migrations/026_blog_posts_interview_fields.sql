-- Interview / guest fields for DB-authored blog posts, mirroring the interview
-- fields already on staticPosts (youtubeVideoId / guestName / guestRole).
-- Lets the admin editor persist podcast-episode-style posts with an embedded
-- YouTube player and a guest byline.
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_role TEXT;

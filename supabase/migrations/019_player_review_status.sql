-- 019_player_review_status.sql
-- Single source of truth for the ADMIN REVIEW of a self-registered profile.
-- is_approved stays the public-visibility gate; review_status drives the queue.
--   'pending'    self-registered, awaiting a human decision (is_approved=false)
--   'approved'   a human approved it (is_approved=true)
--   'denied'     a human denied it with a reason (is_approved=false, recoverable)
--   'unreviewed' imported/scraped, publicly live but never human-checked
alter table public.players
  add column if not exists review_status text not null default 'unreviewed'
    check (review_status in ('pending','approved','denied','unreviewed')),
  add column if not exists denial_reason text,   -- preset key, e.g. 'highlight_broken'
  add column if not exists denial_note   text,   -- optional free-text from admin
  add column if not exists denial_fix    text,   -- rendered "what to fix" shown to athlete
  add column if not exists denied_at     timestamptz,
  add column if not exists reviewed_by   uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at   timestamptz;

-- Backfill so existing rows map cleanly onto the new machine.
update public.players set review_status = 'approved'
  where is_approved = true and (is_claimed = true or is_verified = true);
update public.players set review_status = 'pending'
  where is_approved = false;
-- everything else (scraped, live, unclaimed) stays 'unreviewed'

create index if not exists players_review_status_idx on public.players(review_status);

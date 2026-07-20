-- 018_profile_nudges.sql
-- Records every profile-completion nudge (automated day-10 cron or manual admin
-- click) so the cron never re-nudges the same user and admins can see recency.
create table if not exists public.profile_nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('auto_day10', 'admin')),
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz not null default now()
);

create index if not exists profile_nudges_user_id_idx on public.profile_nudges(user_id);
create index if not exists profile_nudges_source_idx on public.profile_nudges(source);

-- Service-role only: no RLS policies added, matching other admin-only tables.
alter table public.profile_nudges enable row level security;

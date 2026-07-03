create table claim_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('claim', 'release')),
  actor text not null check (actor in ('self', 'admin')),
  created_at timestamptz not null default now()
);
alter table claim_events enable row level security;
-- no policies: service-role only, same convention as every other table here

create table profile_reports (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  reason text,
  reporter_email text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table profile_reports enable row level security;
-- no policies: service-role only

-- TrackLink v0.7.0 — safe, repeatable migration. No existing clicks or links are modified.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth_secret text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint push_endpoint_length check (char_length(endpoint) between 10 and 2048)
);

create table if not exists public.push_preferences (
  id integer primary key default 1 check (id = 1),
  every_click boolean not null default false,
  new_visitor boolean not null default true,
  milestones boolean not null default true,
  daily_summary boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.push_preferences(id) values (1) on conflict (id) do nothing;

create table if not exists public.push_daily_dispatches (
  local_day date primary key,
  created_at timestamptz not null default now()
);

-- The query is evaluated as Europe/Kyiv calendar days, matching existing TrackLink stats.
create or replace function public.tracklink_push_daily_stats(p_day date)
returns table(clicks bigint, visitors bigint)
language sql
security invoker
set search_path = public
stable
as $$
  select count(*)::bigint, count(distinct visitor_id)::bigint
  from public.clicks
  where (clicked_at at time zone 'Europe/Kyiv')::date = p_day;
$$;

alter table public.push_subscriptions enable row level security;
alter table public.push_preferences enable row level security;
alter table public.push_daily_dispatches enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.push_preferences from anon, authenticated;
revoke all on public.push_daily_dispatches from anon, authenticated;
revoke all on function public.tracklink_push_daily_stats(date) from public, anon, authenticated;
grant all on public.push_subscriptions to service_role;
grant all on public.push_preferences to service_role;
grant all on public.push_daily_dispatches to service_role;
grant execute on function public.tracklink_push_daily_stats(date) to service_role;
notify pgrst, 'reload schema';

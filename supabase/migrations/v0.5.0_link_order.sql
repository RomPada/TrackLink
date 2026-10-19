-- TrackLink v0.5.0 — run ONCE in Supabase SQL Editor before enabling link reordering.
-- Does not delete links, groups, or click history. Safe to rerun.

alter table public.links add column if not exists sort_order integer;

-- Assign a stable initial order to existing records inside each group.
-- Links created most recently will appear at the top, as they did before this release.
with ranked as (
  select id,
    (row_number() over (partition by group_id order by created_at desc, id desc) - 1)::integer as position
  from public.links
)
update public.links as l
set sort_order = ranked.position
from ranked
where l.id = ranked.id and l.sort_order is null;

alter table public.links alter column sort_order set default 0;
alter table public.links alter column sort_order set not null;
create index if not exists links_group_sort_order_idx on public.links(group_id, sort_order, created_at desc);

-- Save an entire group's display order in one database transaction.
-- Reject unknown IDs, duplicates, or attempts to reorder another group's links.
create or replace function public.reorder_links_in_group(p_group_id uuid, p_link_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  group_size integer;
  provided_size integer;
begin
  provided_size := coalesce(cardinality(p_link_ids), 0);
  if provided_size < 2 or provided_size > 2000 then
    raise exception 'Invalid link list size';
  end if;

  select count(*) into group_size
  from public.links
  where group_id is not distinct from p_group_id;

  if group_size <> provided_size then
    raise exception 'The group link list has changed; refresh the page';
  end if;

  if (select count(distinct id) from unnest(p_link_ids) as ids(id)) <> provided_size then
    raise exception 'Duplicate link IDs are not allowed';
  end if;

  if exists (
    select 1
    from unnest(p_link_ids) as ids(id)
    left join public.links as links on links.id = ids.id
    where links.id is null
       or links.group_id is distinct from p_group_id
  ) then
    raise exception 'One or more links do not belong to this group';
  end if;

  update public.links as l
  set sort_order = ordered.position::integer - 1
  from unnest(p_link_ids) with ordinality as ordered(id, position)
  where l.id = ordered.id;
end;
$$;

revoke all on function public.reorder_links_in_group(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_links_in_group(uuid, uuid[]) to service_role;

-- link_stats already exists from previous TrackLink releases.
-- Add sort_order at the END so older view columns are not reordered.
create or replace view public.link_stats
with (security_invoker = true)
as
select
  l.id,
  l.name,
  l.slug,
  l.destination_url,
  l.is_active,
  l.created_at,
  count(c.id)::bigint as clicks,
  count(distinct c.visitor_id)::bigint as unique_visitors,
  max(c.clicked_at) as last_click_at,
  count(c.id) filter (
    where (c.clicked_at at time zone 'Europe/Kyiv')::date =
      (now() at time zone 'Europe/Kyiv')::date
  )::bigint as today_clicks,
  count(distinct c.visitor_id) filter (
    where (c.clicked_at at time zone 'Europe/Kyiv')::date =
      (now() at time zone 'Europe/Kyiv')::date
  )::bigint as today_unique,
  count(c.id) filter (
    where (c.clicked_at at time zone 'Europe/Kyiv')::date >=
      (now() at time zone 'Europe/Kyiv')::date - 6
  )::bigint as clicks_7d,
  count(distinct c.visitor_id) filter (
    where (c.clicked_at at time zone 'Europe/Kyiv')::date >=
      (now() at time zone 'Europe/Kyiv')::date - 6
  )::bigint as unique_7d,
  count(c.id) filter (
    where date_trunc('month', c.clicked_at at time zone 'Europe/Kyiv') =
      date_trunc('month', now() at time zone 'Europe/Kyiv')
  )::bigint as month_clicks,
  count(distinct c.visitor_id) filter (
    where date_trunc('month', c.clicked_at at time zone 'Europe/Kyiv') =
      date_trunc('month', now() at time zone 'Europe/Kyiv')
  )::bigint as month_unique,
  l.group_id,
  g.name as group_name,
  l.sort_order
from public.links l
left join public.link_groups g on g.id = l.group_id
left join public.clicks c on c.link_id = l.id
group by l.id, l.name, l.slug, l.destination_url, l.is_active, l.created_at, l.group_id, g.name, l.sort_order;

grant select on public.link_stats to service_role;
revoke all on public.link_stats from anon, authenticated;
notify pgrst, 'reload schema';

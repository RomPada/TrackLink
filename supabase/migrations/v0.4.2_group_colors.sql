-- TrackLink v0.4.2 — group color migration
-- Safe to run more than once in Supabase SQL Editor.

alter table public.link_groups
  add column if not exists background_color text;

update public.link_groups
set background_color = '#e8eef7'
where background_color is null or btrim(background_color) = '';

alter table public.link_groups
  alter column background_color set default '#e8eef7';

alter table public.link_groups
  alter column background_color set not null;

-- Refresh PostgREST / Supabase API schema cache immediately.
NOTIFY pgrst, 'reload schema';

alter table public.announcements
  add column if not exists link_url text,
  add column if not exists attachment_path text,
  add column if not exists attachment_name text;

insert into storage.buckets (id, name, public)
values ('announcements', 'announcements', true)
on conflict (id) do update set public = true;

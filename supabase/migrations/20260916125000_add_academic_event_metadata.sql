alter table public.dates
  add column if not exists event_type text,
  add column if not exists details jsonb;

alter table public.dates
  drop constraint if exists dates_event_type_check;

alter table public.dates
  add constraint dates_event_type_check check (
    event_type is null or event_type in (
      'assignment', 'submission', 'quiz', 'project', 'lab', 'midterm', 'final',
      'lecture', 'registration_start', 'registration_end', 'result_release', 'meeting', 'other'
    )
  );

create index if not exists dates_event_date_idx on public.dates (event_date);

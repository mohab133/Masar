-- Masar dynamic course metadata + bulk study import
-- Run once in Supabase SQL Editor.

alter table public.courses
  add column if not exists department text,
  add column if not exists icon_url text;

alter table public.schedule
  add column if not exists section_number integer,
  add column if not exists lecture_number integer;

-- Keep department values predictable.
update public.courses
set department = 'general'
where department is null or department not in ('general', 'computers', 'control_communications');

create index if not exists courses_department_idx on public.courses(department);

-- Storage bucket for course icons. Course materials remain in their existing bucket.
insert into storage.buckets (id, name, public)
values ('course-icons', 'course-icons', true)
on conflict (id) do update set public = excluded.public;

-- Public read for icons. Upload/delete remains restricted to the service role used by the bot.
drop policy if exists "course-icons public read" on storage.objects;
create policy "course-icons public read"
on storage.objects for select
using (bucket_id = 'course-icons');

-- Transactional bulk importer. The Telegram bot calls this function with service-role credentials.
create or replace function public.import_masar_study_data(
  p_courses jsonb,
  p_schedule jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  existing_id uuid;
  course_code text;
  inserted_courses integer := 0;
  updated_courses integer := 0;
  inserted_schedule integer := 0;
  course_codes text[] := '{}';
begin
  if jsonb_typeof(p_courses) <> 'array' or jsonb_typeof(p_schedule) <> 'array' then
    raise exception 'Invalid import payload';
  end if;

  for item in select value from jsonb_array_elements(p_courses)
  loop
    course_code := trim(item->>'code');
    if course_code is null or course_code = '' then
      raise exception 'Course code cannot be empty';
    end if;

    select id into existing_id
    from public.courses
    where code = course_code
    limit 1;

    if existing_id is null then
      insert into public.courses (id, code, name_en, name_ar, instructor, files_count, department, icon_url)
      values (
        gen_random_uuid(),
        course_code,
        nullif(trim(item->>'name_en'), ''),
        nullif(trim(item->>'name_ar'), ''),
        coalesce(nullif(trim(item->>'instructor'), ''), ''),
        0,
        case when item->>'department' in ('computers','control_communications','general') then item->>'department' else 'general' end,
        nullif(trim(item->>'icon_url'), '')
      );
      inserted_courses := inserted_courses + 1;
    else
      update public.courses
      set name_en = coalesce(nullif(trim(item->>'name_en'), ''), name_en),
          name_ar = coalesce(nullif(trim(item->>'name_ar'), ''), name_ar),
          instructor = coalesce(nullif(trim(item->>'instructor'), ''), instructor),
          department = case when item->>'department' in ('computers','control_communications','general') then item->>'department' else coalesce(department, 'general') end,
          icon_url = coalesce(nullif(trim(item->>'icon_url'), ''), icon_url)
      where id = existing_id;
      updated_courses := updated_courses + 1;
    end if;

    course_codes := array_append(course_codes, course_code);
  end loop;

  -- Reimporting a course replaces only that course's schedule, leaving unrelated courses untouched.
  if array_length(course_codes, 1) is not null then
    delete from public.schedule where course_code = any(course_codes);
  end if;

  for item in select value from jsonb_array_elements(p_schedule)
  loop
    insert into public.schedule (
      id, course, course_code, type, section_number, lecture_number,
      day_of_week, day_name_ar, start_time, end_time, location, instructor
    )
    values (
      gen_random_uuid(),
      trim(item->>'course'),
      trim(item->>'course_code'),
      case when item->>'type' = 'section' then 'section' else 'lecture' end,
      nullif(item->>'section_number','')::integer,
      nullif(item->>'lecture_number','')::integer,
      (item->>'day_of_week')::integer,
      trim(item->>'day_name_ar'),
      trim(item->>'start_time'),
      trim(item->>'end_time'),
      trim(item->>'location'),
      nullif(trim(item->>'instructor'),'')
    );
    inserted_schedule := inserted_schedule + 1;
  end loop;

  return jsonb_build_object(
    'inserted_courses', inserted_courses,
    'updated_courses', updated_courses,
    'inserted_schedule', inserted_schedule
  );
end;
$$;

revoke all on function public.import_masar_study_data(jsonb, jsonb) from public;

-- Adds the optional Storage path used by the app for official schedules.
-- The app treats a schedule as published only when storage_path is present.
alter table public.official_schedules
  add column if not exists storage_path text;

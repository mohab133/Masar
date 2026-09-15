create table if not exists public.feedback_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);

create index if not exists feedback_rate_limits_window_started_at_idx
  on public.feedback_rate_limits (window_started_at);

alter table public.feedback_rate_limits enable row level security;

create or replace function public.consume_feedback_rate_limit(
  p_rate_key text,
  p_limit integer default 5,
  p_window_seconds integer default 3600
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  request_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
begin
  if p_rate_key is null or length(p_rate_key) = 0 then
    return query select true, 0, 0;
    return;
  end if;

  insert into public.feedback_rate_limits (rate_key, window_started_at, request_count)
  values (p_rate_key, v_now, 1)
  on conflict (rate_key) do update
    set request_count = case
      when public.feedback_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else public.feedback_rate_limits.request_count + 1
    end,
    window_started_at = case
      when public.feedback_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else public.feedback_rate_limits.window_started_at
    end
  returning public.feedback_rate_limits.window_started_at, public.feedback_rate_limits.request_count
  into v_window_start, v_count;

  return query
  select
    v_count <= greatest(p_limit, 1),
    case
      when v_count <= greatest(p_limit, 1) then 0
      else greatest(1, ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::integer)
    end,
    v_count;
end;
$$;

revoke all on table public.feedback_rate_limits from anon, authenticated;
revoke all on function public.consume_feedback_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_feedback_rate_limit(text, integer, integer) to service_role;

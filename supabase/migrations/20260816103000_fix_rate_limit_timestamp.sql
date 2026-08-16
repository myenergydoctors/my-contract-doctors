-- Fix collision with PostgreSQL's CURRENT_TIME keyword. The old variable name
-- resolved to time with time zone in SQL expressions instead of timestamptz.

create or replace function public.consume_api_rate_limit(
  p_rate_key text,
  p_max_requests integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.api_rate_limits%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if p_rate_key is null or length(p_rate_key) > 200 then
    raise exception 'invalid rate-limit key';
  end if;
  if p_max_requests < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate-limit configuration';
  end if;

  insert into public.api_rate_limits (rate_key, window_started_at, request_count, updated_at)
  values (p_rate_key, v_now, 0, v_now)
  on conflict (rate_key) do nothing;

  select * into current_row
  from public.api_rate_limits
  where rate_key = p_rate_key
  for update;

  if current_row.window_started_at + make_interval(secs => p_window_seconds) <= v_now then
    update public.api_rate_limits
    set window_started_at = v_now, request_count = 1, updated_at = v_now
    where rate_key = p_rate_key;
    return query select true, p_max_requests - 1, 0;
  elsif current_row.request_count >= p_max_requests then
    return query select
      false,
      0,
      greatest(1, ceil(extract(epoch from (
        current_row.window_started_at + make_interval(secs => p_window_seconds) - v_now
      )))::integer);
  else
    update public.api_rate_limits
    set request_count = request_count + 1, updated_at = v_now
    where rate_key = p_rate_key;
    return query select true, p_max_requests - current_row.request_count - 1, 0;
  end if;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
  to service_role;

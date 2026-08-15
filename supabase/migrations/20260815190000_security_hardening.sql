-- My Contract Doctors production security hardening.
-- Target: OSC Web Design / xrchncayomnwcnphrwhx only.

begin;

-- RLS protects profile rows, but column grants must separately protect
-- server-controlled values such as plan, id, and timestamps.
revoke update on table public.profiles from authenticated;
grant update (first_name, last_name, business_name, industry)
  on table public.profiles to authenticated;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Make update ownership checks explicit for both old and new row values.
drop policy if exists "Users can update own invoices" on public.invoice_analyses;
create policy "Users can update own invoices"
  on public.invoice_analyses
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own line items" on public.invoice_line_items;
create policy "Users can update own line items"
  on public.invoice_line_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Shared, atomic API rate-limit counters. No browser/client role can access
-- the table or function; only the server-side service role can execute it.
create table if not exists public.api_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from public, anon, authenticated;

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
  current_time timestamptz := clock_timestamp();
begin
  if p_rate_key is null or length(p_rate_key) > 200 then
    raise exception 'invalid rate-limit key';
  end if;
  if p_max_requests < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate-limit configuration';
  end if;

  insert into public.api_rate_limits (rate_key, window_started_at, request_count, updated_at)
  values (p_rate_key, current_time, 0, current_time)
  on conflict (rate_key) do nothing;

  select * into current_row
  from public.api_rate_limits
  where rate_key = p_rate_key
  for update;

  if current_row.window_started_at + make_interval(secs => p_window_seconds) <= current_time then
    update public.api_rate_limits
    set window_started_at = current_time, request_count = 1, updated_at = current_time
    where rate_key = p_rate_key;
    return query select true, p_max_requests - 1, 0;
  elsif current_row.request_count >= p_max_requests then
    return query select
      false,
      0,
      greatest(1, ceil(extract(epoch from (
        current_row.window_started_at + make_interval(secs => p_window_seconds) - current_time
      )))::integer);
  else
    update public.api_rate_limits
    set request_count = request_count + 1, updated_at = current_time
    where rate_key = p_rate_key;
    return query select true, p_max_requests - current_row.request_count - 1, 0;
  end if;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
  to service_role;

commit;

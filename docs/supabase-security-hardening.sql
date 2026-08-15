-- =============================================================
-- My Contract Doctors — security hardening migration
--
-- Apply to every existing Supabase project before deploying the admin or
-- discount-code features. Idempotent: safe to run more than once.
-- =============================================================

begin;

-- 1. Prevent authenticated users from changing server-controlled profile
-- fields such as plan and is_admin. RLS limits rows, not columns.
revoke update on table public.profiles from authenticated;
grant update (first_name, last_name, business_name, industry)
  on table public.profiles to authenticated;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Recreate the diagnostic view using the caller's permissions so the RLS
-- policies on invoice_analyses and invoice_line_items remain in force. The
-- explicit auth.uid() predicate is defense in depth.
create or replace view public.invoice_totals_check
with (security_invoker = true) as
select
  i.id as invoice_id,
  i.user_id,
  i.total_due_cents,
  coalesce(sum(case when li.line_type = 'charge'       then li.annual_cost_cents / 12 end), 0)::bigint as line_sum_charges_monthly_cents,
  coalesce(sum(case when li.line_type = 'credit'       then li.annual_cost_cents / 12 end), 0)::bigint as line_sum_credits_monthly_cents,
  coalesce(sum(case when li.line_type = 'past_balance' then li.annual_cost_cents / 12 end), 0)::bigint as line_sum_past_balance_monthly_cents,
  count(li.id) as line_item_count
from public.invoice_analyses i
left join public.invoice_line_items li on li.invoice_id = i.id
where i.user_id = auth.uid()
group by i.id, i.user_id, i.total_due_cents;

revoke all on table public.invoice_totals_check from anon;
grant select on table public.invoice_totals_check to authenticated;

-- 3. Shared API rate-limit counters. There are no client policies: only the
-- service role may call the SECURITY DEFINER function below.
create table if not exists public.api_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from anon, authenticated;

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

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;

commit;

-- Post-deploy verification queries (run as an authenticated non-admin user):
--   update public.profiles set is_admin = true where id = auth.uid(); -- must fail
--   update public.profiles set plan = 'pro' where id = auth.uid();    -- must fail
--   select * from public.invoice_totals_check; -- only the caller's rows

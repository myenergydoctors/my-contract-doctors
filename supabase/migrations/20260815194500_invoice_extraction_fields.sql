-- Derived invoice-extraction fields. The source file in Storage is unchanged.

begin;

alter table public.invoice_line_items
  add column if not exists line_type text;

update public.invoice_line_items set line_type = 'charge' where line_type is null;

alter table public.invoice_line_items
  alter column line_type set default 'charge',
  alter column line_type set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.invoice_line_items'::regclass
      and conname = 'invoice_line_items_line_type_check'
  ) then
    alter table public.invoice_line_items
      add constraint invoice_line_items_line_type_check
      check (line_type in ('charge', 'credit', 'past_balance', 'late_fee', 'discount', 'tax', 'other'));
  end if;
end $$;

alter table public.invoice_analyses
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists gross_charges_cents bigint,
  add column if not exists credits_cents bigint default 0,
  add column if not exists past_balance_cents bigint default 0,
  add column if not exists late_fees_cents bigint default 0,
  add column if not exists taxes_cents bigint default 0,
  add column if not exists total_due_cents bigint,
  add column if not exists extracted_total_check_cents bigint,
  add column if not exists totals_reconciled boolean default false,
  add column if not exists parent_upload_id uuid,
  add column if not exists sibling_count integer default 1,
  add column if not exists sibling_index integer default 0;

create index if not exists idx_invoice_analyses_parent_upload
  on public.invoice_analyses(parent_upload_id)
  where parent_upload_id is not null;

create index if not exists idx_line_items_benchmark_charges
  on public.invoice_line_items(product_id, vendor_id, state)
  where line_type = 'charge'
    and product_id is not null
    and vendor_id is not null
    and unit_price_cents is not null;

-- Diagnostic view over derived rows only. security_invoker preserves the
-- underlying tables' per-user RLS and the explicit predicate adds defense.
create or replace view public.invoice_totals_check
with (security_invoker = true) as
select
  i.id as invoice_id,
  i.user_id,
  i.total_due_cents,
  coalesce(sum(case when li.line_type = 'charge' then li.annual_cost_cents / 12 end), 0)::bigint
    as line_sum_charges_monthly_cents,
  coalesce(sum(case when li.line_type = 'credit' then li.annual_cost_cents / 12 end), 0)::bigint
    as line_sum_credits_monthly_cents,
  coalesce(sum(case when li.line_type = 'past_balance' then li.annual_cost_cents / 12 end), 0)::bigint
    as line_sum_past_balance_monthly_cents,
  count(li.id) as line_item_count
from public.invoice_analyses i
left join public.invoice_line_items li on li.invoice_id = i.id
where i.user_id = auth.uid()
group by i.id, i.user_id, i.total_due_cents;

revoke all on table public.invoice_totals_check from public, anon;
grant select on table public.invoice_totals_check to authenticated;

commit;

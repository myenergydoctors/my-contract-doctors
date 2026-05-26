-- =============================================================
-- My Contract Doctors — Phase 2C-1.5 schema additions
--
-- Real invoices have multiple sub-invoices, credits, past balances,
-- late fees, and discounts. The original 2C-1 schema treated every
-- line as a current charge, which broke total reconciliation. This
-- migration adds the categories we need.
--
-- HOW TO RUN: Supabase SQL Editor → New query → paste → Run.
-- Idempotent.
-- =============================================================


-- ─── 1. Add line_type to invoice_line_items ──────────────────

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_line_items' and column_name = 'line_type') then
    alter table public.invoice_line_items
      add column line_type text not null default 'charge'
      check (line_type in ('charge', 'credit', 'past_balance', 'late_fee', 'discount', 'tax', 'other'));
  end if;
end $$;

comment on column public.invoice_line_items.line_type is
  'What kind of line this is. ''charge''=current-period billable item, ''credit''=refund/adjustment, ''past_balance''=carryover from prior invoice, ''late_fee''=penalty, ''discount''=negotiated reduction, ''tax''=sales tax.';


-- ─── 2. Per-invoice billing period + totals breakdown ────────

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'period_start') then
    alter table public.invoice_analyses add column period_start date;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'period_end') then
    alter table public.invoice_analyses add column period_end date;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'gross_charges_cents') then
    alter table public.invoice_analyses add column gross_charges_cents bigint;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'credits_cents') then
    alter table public.invoice_analyses add column credits_cents bigint default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'past_balance_cents') then
    alter table public.invoice_analyses add column past_balance_cents bigint default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'late_fees_cents') then
    alter table public.invoice_analyses add column late_fees_cents bigint default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'taxes_cents') then
    alter table public.invoice_analyses add column taxes_cents bigint default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'total_due_cents') then
    alter table public.invoice_analyses add column total_due_cents bigint;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'extracted_total_check_cents') then
    alter table public.invoice_analyses add column extracted_total_check_cents bigint;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'totals_reconciled') then
    alter table public.invoice_analyses add column totals_reconciled boolean default false;
  end if;
end $$;

comment on column public.invoice_analyses.gross_charges_cents is
  'Sum of current-period charges only. The "what they''re actually paying" number, used for benchmarking.';
comment on column public.invoice_analyses.total_due_cents is
  'What the invoice says is due at the bottom. The number the customer pays.';
comment on column public.invoice_analyses.extracted_total_check_cents is
  'Our computed gross - credits + past_balance + late_fees + taxes. If this matches total_due_cents, totals_reconciled=true.';


-- ─── 3. Multi-invoice support: parent_upload_id ──────────────
-- When one PDF contains multiple invoices, we create N invoice_analyses
-- rows but link them via parent_upload_id so we can group them in the UI.

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'parent_upload_id') then
    alter table public.invoice_analyses add column parent_upload_id uuid;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'sibling_count') then
    alter table public.invoice_analyses add column sibling_count int default 1;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'sibling_index') then
    alter table public.invoice_analyses add column sibling_index int default 0;
  end if;
end $$;

comment on column public.invoice_analyses.parent_upload_id is
  'Groups multiple invoices extracted from a single uploaded file. All siblings share this id. NULL for single-invoice uploads.';


-- ─── 4. Index for benchmark queries ──────────────────────────
-- Benchmarks should only consider current-period charges. This partial
-- index makes those queries fast at scale.

create index if not exists idx_line_items_benchmark_charges
  on public.invoice_line_items(product_id, vendor_id, state)
  where line_type = 'charge' and product_id is not null and vendor_id is not null and unit_price_cents is not null;


-- ─── 5. Helpful view: per-invoice reconciled totals ──────────
-- Computed view that recalculates totals from line_items, so we can sanity-
-- check vs the stored extracted_total_check_cents.

create or replace view public.invoice_totals_check as
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
group by i.id, i.user_id, i.total_due_cents;

comment on view public.invoice_totals_check is
  'Debug view: recalculates per-invoice totals from line_items to catch math drift. Compare with invoice_analyses.gross_charges_cents etc.';

-- Grant select to authenticated so the inspector UI can use this view
grant select on public.invoice_totals_check to authenticated;


-- =============================================================
-- DONE.
-- =============================================================

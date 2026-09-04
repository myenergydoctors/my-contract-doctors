-- Make vendor products variant-aware and add the telemetry required for a
-- controlled extraction-learning loop.

begin;

alter table public.vendor_products
  drop constraint if exists vendor_products_vendor_id_vendor_item_code_key;

alter table public.vendor_products
  alter column vendor_item_code drop not null;

update public.vendor_products
set source_key = concat(
  coalesce(nullif(btrim(upper(vendor_item_code)), ''), 'NO-CODE'),
  '::',
  btrim(regexp_replace(
    upper(regexp_replace(coalesce(display_name, ''), '\s*\([0-9]{1,10}\)\s*$', '')),
    '[^A-Z0-9]+',
    ' ',
    'g'
  ))
)
where source_key is null;

drop index if exists public.idx_vendor_products_source_key;

alter table public.vendor_products
  alter column source_key set not null,
  add constraint vendor_products_vendor_source_key_unique
    unique (vendor_id, source_key);

comment on column public.vendor_products.source_key is
  'Variant-aware key built from vendor item code plus normalized description. Codes may repeat across sizes and other separately priced variants.';

alter table public.invoice_line_items
  add column if not exists vendor_product_source_key text,
  add column if not exists source_group_label text,
  add column if not exists extraction_confidence numeric(5, 4),
  add column if not exists field_confidences jsonb not null default '{}'::jsonb;

alter table public.invoice_line_items
  add constraint invoice_line_items_extraction_confidence_check
  check (extraction_confidence is null or extraction_confidence between 0 and 1);

create index idx_invoice_line_items_vendor_source_key
  on public.invoice_line_items(vendor_id, vendor_product_source_key)
  where vendor_product_source_key is not null;

alter table public.invoice_extraction_jobs
  add column if not exists prompt_version text not null default 'legacy',
  add column if not exists extraction_schema_version text not null default 'legacy',
  add column if not exists document_quality text,
  add column if not exists document_quality_notes text,
  add column if not exists evaluation_status text not null default 'not_evaluated';

alter table public.invoice_extraction_jobs
  add constraint invoice_extraction_jobs_document_quality_check
  check (document_quality is null or document_quality in ('high', 'medium', 'low', 'unreadable')),
  add constraint invoice_extraction_jobs_evaluation_status_check
  check (evaluation_status in ('not_evaluated', 'needs_review', 'evaluated', 'excluded'));

create table public.invoice_extraction_evaluations (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  invoice_id            uuid not null references public.invoice_analyses(id) on delete cascade,
  extraction_job_id     uuid references public.invoice_extraction_jobs(id) on delete set null,
  evaluation_set        text not null default 'customer_review',
  ground_truth_status   text not null default 'in_progress'
                        check (ground_truth_status in ('in_progress', 'approved', 'rejected', 'excluded')),
  document_quality      text
                        check (document_quality is null or document_quality in ('high', 'medium', 'low', 'unreadable')),
  expected_line_count   integer check (expected_line_count is null or expected_line_count >= 0),
  extracted_line_count  integer check (extracted_line_count is null or extracted_line_count >= 0),
  field_metrics         jsonb not null default '{}'::jsonb,
  reconciliation_passed boolean,
  failure_tags          text[] not null default array[]::text[],
  notes                 text,
  reviewed_by           uuid references auth.users(id) on delete set null,
  reviewed_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (invoice_id, evaluation_set)
);

create table public.vendor_extraction_patterns (
  id                uuid primary key default gen_random_uuid(),
  vendor_id         uuid not null references public.vendors(id) on delete cascade,
  pattern_type      text not null
                    check (pattern_type in ('column_layout', 'description_cleanup', 'summary_breakdown', 'frequency_rule', 'item_code_rule', 'other')),
  pattern_key       text not null,
  pattern_data      jsonb not null default '{}'::jsonb,
  status            text not null default 'candidate'
                    check (status in ('candidate', 'active', 'rejected', 'retired')),
  confidence        numeric(5, 4) not null default 0.5
                    check (confidence between 0 and 1),
  success_count     integer not null default 0 check (success_count >= 0),
  failure_count     integer not null default 0 check (failure_count >= 0),
  source_invoice_id uuid references public.invoice_analyses(id) on delete set null,
  approved_by       uuid references auth.users(id) on delete set null,
  approved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (vendor_id, pattern_type, pattern_key)
);

create index idx_invoice_extraction_evaluations_set
  on public.invoice_extraction_evaluations(evaluation_set, ground_truth_status, created_at);
create index idx_vendor_extraction_patterns_active
  on public.vendor_extraction_patterns(vendor_id, pattern_type, confidence desc)
  where status = 'active';

create trigger set_invoice_extraction_evaluations_updated_at
  before update on public.invoice_extraction_evaluations
  for each row execute function public.set_updated_at();
create trigger set_vendor_extraction_patterns_updated_at
  before update on public.vendor_extraction_patterns
  for each row execute function public.set_updated_at();

alter table public.invoice_extraction_evaluations enable row level security;
alter table public.vendor_extraction_patterns enable row level security;

create policy "Members can view extraction evaluations"
  on public.invoice_extraction_evaluations for select to authenticated
  using (public.is_organization_member(organization_id));

create policy "Authenticated can view active vendor extraction patterns"
  on public.vendor_extraction_patterns for select to authenticated
  using (status = 'active');

grant select on table
  public.invoice_extraction_evaluations,
  public.vendor_extraction_patterns
to authenticated;

grant select, insert, update, delete on table
  public.invoice_extraction_evaluations,
  public.vendor_extraction_patterns
to service_role;

commit;

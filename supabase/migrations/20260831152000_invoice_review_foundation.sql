-- Additive invoice review, customer correction, and catalog-review foundation.
-- Browser writes remain disabled; authenticated server routes perform reviewed
-- mutations with the service role after checking invoice access.

begin;

alter table public.invoice_analyses
  add column if not exists organization_id uuid
    references public.organizations(id) on delete restrict,
  add column if not exists location_id uuid
    references public.locations(id) on delete set null,
  add column if not exists organization_vendor_id uuid
    references public.organization_vendors(id) on delete set null,
  add column if not exists review_status text not null default 'not_started',
  add column if not exists reviewed_by uuid
    references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_version integer not null default 0,
  add column if not exists printed_subtotal_cents bigint,
  add column if not exists reconciliation_difference_cents bigint,
  add column if not exists analysis_ready_at timestamptz;

update public.invoice_analyses i
set organization_id = o.id
from public.organizations o
where i.organization_id is null
  and o.id = i.user_id;

alter table public.invoice_analyses
  add constraint invoice_analyses_review_status_check
  check (review_status in (
    'not_started',
    'needs_review',
    'ready_for_confirmation',
    'confirmed',
    'reopened'
  ));

alter table public.invoice_line_items
  add column if not exists organization_id uuid
    references public.organizations(id) on delete restrict,
  add column if not exists vendor_product_id uuid
    references public.vendor_products(id) on delete set null,
  add column if not exists source_page integer,
  add column if not exists source_row_index integer,
  add column if not exists raw_vendor_item_code text,
  add column if not exists raw_description text,
  add column if not exists raw_quantity numeric,
  add column if not exists raw_unit_rate numeric(18, 6),
  add column if not exists raw_line_total_cents bigint,
  add column if not exists raw_billing_frequency text,
  add column if not exists raw_extraction jsonb not null default '{}'::jsonb,
  add column if not exists confirmed_description text,
  add column if not exists confirmed_quantity numeric,
  add column if not exists confirmed_unit_rate numeric(18, 6),
  add column if not exists confirmed_line_total_cents bigint,
  add column if not exists confirmed_billing_frequency text,
  add column if not exists confirmed_line_type text,
  add column if not exists mapping_confidence numeric(5, 4),
  add column if not exists mapping_source text,
  add column if not exists review_status text not null default 'needs_review',
  add column if not exists review_severity text not null default 'yellow',
  add column if not exists confirmed_by uuid
    references auth.users(id) on delete set null,
  add column if not exists confirmed_at timestamptz;

update public.invoice_line_items li
set
  organization_id = i.organization_id,
  raw_vendor_item_code = coalesce(li.raw_vendor_item_code, li.vendor_item_code),
  raw_description = coalesce(li.raw_description, li.raw_label),
  raw_quantity = coalesce(li.raw_quantity, li.quantity),
  raw_unit_rate = coalesce(li.raw_unit_rate, li.unit_price_cents::numeric / 100),
  confirmed_description = coalesce(li.confirmed_description, li.raw_label),
  confirmed_quantity = coalesce(li.confirmed_quantity, li.quantity),
  confirmed_unit_rate = coalesce(li.confirmed_unit_rate, li.unit_price_cents::numeric / 100),
  confirmed_billing_frequency = coalesce(li.confirmed_billing_frequency, li.billing_frequency),
  confirmed_line_type = coalesce(li.confirmed_line_type, li.line_type)
from public.invoice_analyses i
where i.id = li.invoice_id;

alter table public.invoice_line_items
  add constraint invoice_line_items_review_status_check
  check (review_status in (
    'needs_review',
    'system_matched',
    'confirmed',
    'customer_corrected',
    'unmatched',
    'excluded'
  )),
  add constraint invoice_line_items_review_severity_check
  check (review_severity in ('none', 'yellow', 'red')),
  add constraint invoice_line_items_mapping_confidence_check
  check (mapping_confidence is null or mapping_confidence between 0 and 1);

create table public.invoice_review_issues (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  invoice_id        uuid not null references public.invoice_analyses(id) on delete cascade,
  line_item_id      uuid references public.invoice_line_items(id) on delete cascade,
  severity          text not null check (severity in ('yellow', 'red')),
  issue_code        text not null,
  message           text not null,
  details           jsonb not null default '{}'::jsonb,
  status            text not null default 'open'
                    check (status in ('open', 'resolved')),
  resolved_by       uuid references auth.users(id) on delete set null,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.invoice_line_item_corrections (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  invoice_id        uuid not null references public.invoice_analyses(id) on delete cascade,
  line_item_id      uuid not null references public.invoice_line_items(id) on delete cascade,
  field_name        text not null,
  previous_value    jsonb,
  corrected_value   jsonb,
  correction_reason text,
  corrected_by      uuid not null references auth.users(id) on delete restrict,
  created_at        timestamptz not null default now()
);

create table public.catalog_review_items (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid references public.organizations(id) on delete set null,
  vendor_id             uuid not null references public.vendors(id) on delete restrict,
  invoice_line_item_id  uuid references public.invoice_line_items(id) on delete set null,
  review_type           text not null
                        check (review_type in ('new_product', 'mapping_correction', 'category_correction', 'attribute_correction')),
  proposed_data         jsonb not null default '{}'::jsonb,
  status                text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected', 'duplicate')),
  submitted_by          uuid references auth.users(id) on delete set null,
  reviewed_by           uuid references auth.users(id) on delete set null,
  reviewed_at           timestamptz,
  review_notes          text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_invoice_analyses_organization
  on public.invoice_analyses(organization_id, uploaded_at desc);
create index if not exists idx_invoice_line_items_organization
  on public.invoice_line_items(organization_id, invoice_id);
create index if not exists idx_invoice_line_items_vendor_product
  on public.invoice_line_items(vendor_product_id)
  where vendor_product_id is not null;
create index idx_invoice_review_issues_open
  on public.invoice_review_issues(invoice_id, severity, line_item_id)
  where status = 'open';
create index idx_invoice_line_item_corrections_line
  on public.invoice_line_item_corrections(line_item_id, created_at);
create index idx_catalog_review_items_pending
  on public.catalog_review_items(status, vendor_id, created_at)
  where status = 'pending';

create trigger set_invoice_review_issues_updated_at
  before update on public.invoice_review_issues
  for each row execute function public.set_updated_at();
create trigger set_catalog_review_items_updated_at
  before update on public.catalog_review_items
  for each row execute function public.set_updated_at();

alter table public.invoice_review_issues enable row level security;
alter table public.invoice_line_item_corrections enable row level security;
alter table public.catalog_review_items enable row level security;

create policy "Members can view invoice review issues"
  on public.invoice_review_issues for select to authenticated
  using (public.is_organization_member(organization_id));

create policy "Members can view invoice corrections"
  on public.invoice_line_item_corrections for select to authenticated
  using (public.is_organization_member(organization_id));

create policy "Members can view own catalog submissions"
  on public.catalog_review_items for select to authenticated
  using (
    organization_id is not null
    and public.is_organization_member(organization_id)
  );

grant select on table
  public.invoice_review_issues,
  public.invoice_line_item_corrections,
  public.catalog_review_items
to authenticated;

grant select, insert, update, delete on table
  public.invoice_review_issues,
  public.invoice_line_item_corrections,
  public.catalog_review_items
to service_role;

commit;

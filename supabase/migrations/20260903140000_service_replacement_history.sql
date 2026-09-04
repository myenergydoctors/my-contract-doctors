-- Pro service and physical-replacement history.
-- Eligibility is explicit catalog metadata. AI suggestions are stored
-- separately and never enable customer tracking controls.

begin;

alter table public.vendor_products
  add column if not exists replacement_tracking_eligibility text not null default 'unreviewed',
  add column if not exists replacement_tracking_category text,
  add column if not exists replacement_tracking_suggested_category text,
  add column if not exists replacement_tracking_suggestion_source text,
  add column if not exists replacement_tracking_reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists replacement_tracking_reviewed_at timestamptz;

alter table public.vendor_products
  add constraint vendor_products_replacement_tracking_eligibility_check
    check (replacement_tracking_eligibility in ('unreviewed', 'eligible', 'ineligible')),
  add constraint vendor_products_replacement_tracking_category_check
    check (replacement_tracking_category is null or replacement_tracking_category in (
      'floor_mat_physical_replacement',
      'soap_dispenser',
      'air_care_dispenser',
      'paper_towel_dispenser',
      'toilet_tissue_dispenser'
    )),
  add constraint vendor_products_replacement_tracking_suggestion_check
    check (replacement_tracking_suggested_category is null or replacement_tracking_suggested_category in (
      'floor_mat_physical_replacement',
      'soap_dispenser',
      'air_care_dispenser',
      'paper_towel_dispenser',
      'toilet_tissue_dispenser'
    )),
  add constraint vendor_products_replacement_tracking_explicit_check
    check (replacement_tracking_eligibility <> 'eligible' or replacement_tracking_category is not null);

create index if not exists idx_vendor_products_replacement_tracking
  on public.vendor_products(replacement_tracking_category, id)
  where catalog_status = 'approved' and replacement_tracking_eligibility = 'eligible';

create table public.service_replacement_baselines (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  vendor_product_id   uuid not null references public.vendor_products(id) on delete restrict,
  category            text not null check (category in (
    'floor_mat_physical_replacement',
    'soap_dispenser',
    'air_care_dispenser',
    'paper_towel_dispenser',
    'toilet_tissue_dispenser'
  )),
  product_name        text not null check (length(btrim(product_name)) > 0),
  facility_name       text not null check (length(btrim(facility_name)) > 0),
  baseline_status     text not null check (baseline_status in (
    'last_replaced', 'approximately_replaced', 'never_replaced', 'unknown'
  )),
  replacement_date    date,
  source_invoice_id   uuid references public.invoice_analyses(id) on delete set null,
  established_by      uuid not null references auth.users(id) on delete restrict,
  established_at      timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (
    (baseline_status in ('last_replaced', 'approximately_replaced') and replacement_date is not null)
    or (baseline_status in ('never_replaced', 'unknown') and replacement_date is null)
  )
);

create unique index service_replacement_baselines_scope_key
  on public.service_replacement_baselines(organization_id, vendor_product_id, lower(facility_name));

create table public.service_replacement_invoice_responses (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  invoice_id          uuid not null references public.invoice_analyses(id) on delete cascade,
  vendor_product_id   uuid not null references public.vendor_products(id) on delete restrict,
  category            text not null check (category in (
    'floor_mat_physical_replacement',
    'soap_dispenser',
    'air_care_dispenser',
    'paper_towel_dispenser',
    'toilet_tissue_dispenser'
  )),
  product_name        text not null check (length(btrim(product_name)) > 0),
  facility_name       text not null check (length(btrim(facility_name)) > 0),
  response            text not null check (response in ('replaced', 'not_replaced', 'not_sure', 'dont_track')),
  responded_by        uuid not null references auth.users(id) on delete restrict,
  responded_at        timestamptz not null default now(),
  unique (invoice_id, vendor_product_id)
);

create table public.service_replacement_events (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  vendor_product_id   uuid not null references public.vendor_products(id) on delete restrict,
  invoice_response_id uuid references public.service_replacement_invoice_responses(id) on delete set null,
  source_invoice_id   uuid references public.invoice_analyses(id) on delete set null,
  category            text not null check (category in (
    'floor_mat_physical_replacement',
    'soap_dispenser',
    'air_care_dispenser',
    'paper_towel_dispenser',
    'toilet_tissue_dispenser'
  )),
  product_name        text not null check (length(btrim(product_name)) > 0),
  replacement_date    date,
  date_precision      text not null check (date_precision in ('exact', 'approximate', 'unknown')),
  quantity            numeric check (quantity is null or quantity > 0),
  facility_name       text not null check (length(btrim(facility_name)) > 0),
  reported_source     text not null check (reported_source in (
    'vendor', 'facility_manager', 'customer', 'service_record', 'other', 'unknown'
  )),
  notes               text,
  evidence_path       text,
  evidence_file_name  text,
  evidence_media_type text,
  evidence_size_bytes bigint,
  confirmed_by        uuid not null references auth.users(id) on delete restrict,
  confirmed_at        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  check ((date_precision = 'unknown' and replacement_date is null) or (date_precision <> 'unknown' and replacement_date is not null))
);

create table public.service_replacement_follow_ups (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  invoice_response_id uuid not null references public.service_replacement_invoice_responses(id) on delete cascade,
  action_type         text not null check (action_type in ('ask_vendor', 'assign_facility_manager')),
  status              text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  assigned_label      text,
  created_by          uuid not null references auth.users(id) on delete restrict,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz,
  unique (invoice_response_id, action_type)
);

create table public.service_replacement_tracking_preferences (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  vendor_product_id   uuid not null references public.vendor_products(id) on delete restrict,
  facility_name       text not null check (length(btrim(facility_name)) > 0),
  tracking_enabled    boolean not null default true,
  changed_by          uuid not null references auth.users(id) on delete restrict,
  changed_at          timestamptz not null default now()
);

create unique index service_replacement_tracking_preferences_scope_key
  on public.service_replacement_tracking_preferences(organization_id, vendor_product_id, lower(facility_name));
create index service_replacement_events_history_idx
  on public.service_replacement_events(organization_id, vendor_product_id, replacement_date desc, confirmed_at desc);
create unique index service_replacement_events_invoice_response_key
  on public.service_replacement_events(invoice_response_id)
  where invoice_response_id is not null;
create index service_replacement_responses_invoice_idx
  on public.service_replacement_invoice_responses(invoice_id, vendor_product_id);
create index service_replacement_follow_ups_open_idx
  on public.service_replacement_follow_ups(organization_id, status, created_at)
  where status = 'open';

create trigger set_service_replacement_baselines_updated_at
  before update on public.service_replacement_baselines
  for each row execute function public.set_updated_at();

alter table public.service_replacement_baselines enable row level security;
alter table public.service_replacement_invoice_responses enable row level security;
alter table public.service_replacement_events enable row level security;
alter table public.service_replacement_follow_ups enable row level security;
alter table public.service_replacement_tracking_preferences enable row level security;

create policy "Members can view replacement baselines"
  on public.service_replacement_baselines for select to authenticated
  using (public.is_organization_member(organization_id));
create policy "Members can view replacement responses"
  on public.service_replacement_invoice_responses for select to authenticated
  using (public.is_organization_member(organization_id));
create policy "Members can view replacement events"
  on public.service_replacement_events for select to authenticated
  using (public.is_organization_member(organization_id));
create policy "Members can view replacement follow ups"
  on public.service_replacement_follow_ups for select to authenticated
  using (public.is_organization_member(organization_id));
create policy "Members can view replacement preferences"
  on public.service_replacement_tracking_preferences for select to authenticated
  using (public.is_organization_member(organization_id));

grant select on table
  public.service_replacement_baselines,
  public.service_replacement_invoice_responses,
  public.service_replacement_events,
  public.service_replacement_follow_ups,
  public.service_replacement_tracking_preferences
to authenticated;

grant select, insert, update, delete on table
  public.service_replacement_baselines,
  public.service_replacement_invoice_responses,
  public.service_replacement_events,
  public.service_replacement_follow_ups,
  public.service_replacement_tracking_preferences
to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'replacement-evidence',
  'replacement-evidence',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;

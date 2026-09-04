-- Real agreement upload, preview, lead attribution, and invoice linking.

alter table public.agreement_analyses
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists status text not null default 'completed'
    check (status in ('processing', 'completed', 'failed')),
  add column if not exists review_status text not null default 'needs_review'
    check (review_status in ('needs_review', 'confirmed')),
  add column if not exists agreement_number text,
  add column if not exists effective_date date,
  add column if not exists expiration_date date,
  add column if not exists renewal_notice_days integer
    check (renewal_notice_days is null or renewal_notice_days between 0 and 3650),
  add column if not exists renewal_deadline date,
  add column if not exists detected_type text,
  add column if not exists page_count integer check (page_count is null or page_count between 1 and 10000),
  add column if not exists document_quality text,
  add column if not exists document_quality_notes text,
  add column if not exists finding_count integer check (finding_count is null or finding_count between 0 and 500),
  add column if not exists free_finding_kind text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.agreement_analyses
set organization_id = user_id
where organization_id is null
  and exists (select 1 from public.organizations o where o.id = agreement_analyses.user_id);

create index if not exists idx_agreement_analyses_organization_uploaded
  on public.agreement_analyses(organization_id, uploaded_at desc);
create index if not exists idx_agreement_analyses_user_status
  on public.agreement_analyses(user_id, status, uploaded_at desc);

create table if not exists public.agreement_upload_sessions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  token_hash            text not null,
  status                text not null default 'awaiting_upload'
                        check (status in ('awaiting_upload', 'uploading', 'uploaded', 'consumed', 'expired', 'failed')),
  storage_bucket        text,
  storage_path          text,
  original_filename     text,
  mime_type             text,
  file_size_bytes       bigint check (file_size_bytes is null or file_size_bytes between 1 and 26214400),
  agreement_analysis_id uuid references public.agreement_analyses(id) on delete set null,
  expires_at            timestamptz not null,
  uploaded_at           timestamptz,
  consumed_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists public.agreement_leads (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  organization_id       uuid references public.organizations(id) on delete set null,
  agreement_analysis_id uuid not null references public.agreement_analyses(id) on delete cascade,
  email                 text not null,
  business_name         text,
  marketing_consent     boolean not null default false,
  consent_version       text not null default 'agreement-results-v1',
  source                 text not null default 'agreement-flow',
  finding_count         integer check (finding_count is null or finding_count between 0 and 500),
  locked_finding_count  integer check (locked_finding_count is null or locked_finding_count between 0 and 500),
  free_finding_kind     text,
  linked_invoice_count  integer check (linked_invoice_count is null or linked_invoice_count between 0 and 10000),
  result_profiled_at    timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (agreement_analysis_id)
);

create table if not exists public.agreement_invoice_links (
  agreement_analysis_id uuid not null references public.agreement_analyses(id) on delete cascade,
  invoice_analysis_id   uuid not null references public.invoice_analyses(id) on delete cascade,
  organization_id       uuid references public.organizations(id) on delete cascade,
  match_method          text not null default 'vendor-name'
                        check (match_method in ('vendor-name', 'customer-confirmed')),
  created_at            timestamptz not null default now(),
  primary key (agreement_analysis_id, invoice_analysis_id)
);

create table if not exists public.agreement_entitlements (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  agreement_analysis_id uuid not null references public.agreement_analyses(id) on delete cascade,
  source                text not null check (source in ('one-time-purchase', 'pro-credit', 'admin-grant')),
  active                boolean not null default true,
  granted_at            timestamptz not null default now(),
  unique (user_id, agreement_analysis_id)
);

create index if not exists idx_agreement_upload_sessions_user_created
  on public.agreement_upload_sessions(user_id, created_at desc);
create index if not exists idx_agreement_upload_sessions_expiry
  on public.agreement_upload_sessions(expires_at)
  where status in ('awaiting_upload', 'uploading', 'uploaded');
create index if not exists idx_agreement_leads_marketing_segments
  on public.agreement_leads(marketing_consent, free_finding_kind, linked_invoice_count, created_at desc);
create index if not exists idx_agreement_invoice_links_invoice
  on public.agreement_invoice_links(invoice_analysis_id);

alter table public.agreement_upload_sessions enable row level security;
alter table public.agreement_leads enable row level security;
alter table public.agreement_invoice_links enable row level security;
alter table public.agreement_entitlements enable row level security;

revoke all on table public.agreement_upload_sessions, public.agreement_leads, public.agreement_invoice_links, public.agreement_entitlements from anon, authenticated;

comment on table public.agreement_upload_sessions is
  'Expiring server-mediated handoff from an authenticated desktop agreement flow to an untrusted phone browser.';
comment on table public.agreement_leads is
  'Agreement results destination and separately recorded marketing consent, enriched with finding and linked-invoice context.';
comment on table public.agreement_invoice_links is
  'Explicit evidence relationship between one agreement and saved invoices for the same organization and vendor.';

-- Real cross-device invoice handoff and invoice-specific lead attribution.

create table if not exists public.invoice_upload_sessions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  token_hash             text not null,
  status                 text not null default 'awaiting_upload'
                         check (status in ('awaiting_upload', 'uploading', 'uploaded', 'consumed', 'expired', 'failed')),
  storage_bucket         text,
  storage_path           text,
  original_filename      text,
  mime_type              text,
  file_size_bytes        bigint check (file_size_bytes is null or file_size_bytes between 1 and 26214400),
  invoice_analysis_id    uuid references public.invoice_analyses(id) on delete set null,
  expires_at             timestamptz not null,
  uploaded_at            timestamptz,
  consumed_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_invoice_upload_sessions_user_created
  on public.invoice_upload_sessions(user_id, created_at desc);
create index if not exists idx_invoice_upload_sessions_expiry
  on public.invoice_upload_sessions(expires_at)
  where status in ('awaiting_upload', 'uploading', 'uploaded');

create table if not exists public.invoice_leads (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  organization_id       uuid references public.organizations(id) on delete set null,
  invoice_analysis_id   uuid not null references public.invoice_analyses(id) on delete cascade,
  email                 text not null,
  business_name         text,
  marketing_consent     boolean not null default false,
  consent_version       text not null default 'invoice-results-v1',
  source                 text not null default 'invoice-flow',
  finding_count         integer check (finding_count is null or finding_count between 0 and 500),
  locked_finding_count  integer check (locked_finding_count is null or locked_finding_count between 0 and 500),
  free_finding_kind     text,
  result_profiled_at    timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (invoice_analysis_id)
);

create index if not exists idx_invoice_leads_marketing_segments
  on public.invoice_leads(marketing_consent, free_finding_kind, created_at desc);
create index if not exists idx_invoice_leads_user
  on public.invoice_leads(user_id, created_at desc);

alter table public.invoice_upload_sessions enable row level security;
alter table public.invoice_leads enable row level security;

-- Both tables are written by authenticated server routes using the service
-- role. Customers never receive another customer's handoff token or lead data.
revoke all on table public.invoice_upload_sessions, public.invoice_leads from anon, authenticated;

comment on table public.invoice_upload_sessions is
  'Expiring server-mediated handoff from an authenticated desktop invoice flow to an untrusted phone browser.';
comment on table public.invoice_leads is
  'Invoice results destination and separately recorded marketing consent, enriched with the supported finding profile after confirmation.';

-- Generic document intake and page-range classification.
-- A single uploaded PDF can contain multiple invoices, multiple agreements,
-- or a mixture of document types. Downstream analyses reference the detected
-- segment instead of assuming that one file equals one document.

begin;

create table public.document_uploads (
  id                         uuid primary key default gen_random_uuid(),
  organization_id            uuid not null references public.organizations(id) on delete cascade,
  user_id                    uuid not null references auth.users(id) on delete cascade,
  storage_bucket             text not null,
  storage_path               text not null,
  original_filename          text,
  media_type                 text,
  size_bytes                 bigint check (size_bytes is null or size_bytes >= 0),
  page_count                 integer check (page_count is null or page_count > 0),
  classification_status      text not null default 'pending'
                             check (classification_status in ('pending', 'processing', 'needs_review', 'confirmed', 'failed')),
  detected_type              text
                             check (detected_type in ('invoice', 'agreement', 'mixed', 'statement', 'purchase-order', 'receipt', 'other')),
  detected_type_confidence   numeric(5,4)
                             check (detected_type_confidence is null or detected_type_confidence between 0 and 1),
  confirmed_type             text
                             check (confirmed_type in ('invoice', 'agreement', 'mixed', 'statement', 'purchase-order', 'receipt', 'other')),
  document_quality           text
                             check (document_quality in ('high', 'medium', 'low', 'unreadable')),
  document_quality_notes     text,
  classifier_model           text,
  classifier_prompt_version  text,
  classifier_schema_version  text,
  raw_classification         jsonb,
  confirmed_by               uuid references auth.users(id) on delete set null,
  confirmed_at               timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (user_id, storage_bucket, storage_path)
);

create table public.document_segments (
  id                    uuid primary key default gen_random_uuid(),
  upload_id             uuid not null references public.document_uploads(id) on delete cascade,
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  segment_index         integer not null check (segment_index >= 0),
  page_start            integer not null check (page_start > 0),
  page_end              integer not null check (page_end >= page_start),
  detected_type         text not null
                        check (detected_type in ('invoice', 'agreement', 'statement', 'purchase-order', 'receipt', 'other')),
  confidence            numeric(5,4) not null check (confidence between 0 and 1),
  reason                text,
  vendor_name           text,
  document_number       text,
  document_date         date,
  review_status         text not null default 'needs_review'
                        check (review_status in ('needs_review', 'confirmed', 'corrected', 'excluded')),
  confirmed_type        text
                        check (confirmed_type in ('invoice', 'agreement', 'statement', 'purchase-order', 'receipt', 'other')),
  confirmed_by          uuid references auth.users(id) on delete set null,
  confirmed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (upload_id, segment_index),
  unique (upload_id, page_start, page_end)
);

create table public.document_classification_corrections (
  id                    uuid primary key default gen_random_uuid(),
  upload_id             uuid not null references public.document_uploads(id) on delete cascade,
  segment_id            uuid references public.document_segments(id) on delete cascade,
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  field_name            text not null,
  original_value        jsonb,
  corrected_value       jsonb,
  corrected_by          uuid not null references auth.users(id) on delete restrict,
  created_at            timestamptz not null default now()
);

alter table public.invoice_analyses
  add column if not exists document_upload_id uuid references public.document_uploads(id) on delete set null,
  add column if not exists source_segment_id uuid references public.document_segments(id) on delete set null,
  add column if not exists source_page_start integer,
  add column if not exists source_page_end integer;

alter table public.agreement_analyses
  add column if not exists document_upload_id uuid references public.document_uploads(id) on delete set null,
  add column if not exists source_segment_id uuid references public.document_segments(id) on delete set null,
  add column if not exists source_page_start integer,
  add column if not exists source_page_end integer;

create index idx_document_uploads_organization_created
  on public.document_uploads(organization_id, created_at desc);
create index idx_document_uploads_user_status
  on public.document_uploads(user_id, classification_status, created_at desc);
create index idx_document_segments_upload_pages
  on public.document_segments(upload_id, page_start, page_end);
create index idx_document_segments_type
  on public.document_segments(organization_id, detected_type, review_status);
create index idx_document_corrections_upload
  on public.document_classification_corrections(upload_id, created_at);
create index idx_invoice_analyses_document_upload
  on public.invoice_analyses(document_upload_id)
  where document_upload_id is not null;
create index idx_agreement_analyses_document_upload
  on public.agreement_analyses(document_upload_id)
  where document_upload_id is not null;

create trigger set_document_uploads_updated_at
  before update on public.document_uploads
  for each row execute function public.set_updated_at();
create trigger set_document_segments_updated_at
  before update on public.document_segments
  for each row execute function public.set_updated_at();

alter table public.document_uploads enable row level security;
alter table public.document_segments enable row level security;
alter table public.document_classification_corrections enable row level security;

create policy "Members can view document uploads"
  on public.document_uploads for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "Members can view document segments"
  on public.document_segments for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "Members can view document classification corrections"
  on public.document_classification_corrections for select
  to authenticated
  using (public.is_organization_member(organization_id));

grant select on table
  public.document_uploads,
  public.document_segments,
  public.document_classification_corrections
to authenticated;

grant select, insert, update, delete on table
  public.document_uploads,
  public.document_segments,
  public.document_classification_corrections
to service_role;

commit;

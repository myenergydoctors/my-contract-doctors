-- Preserve earlier confirmed classifications while a document is reprocessed.
-- A failed replacement must not erase the page ranges used by the existing
-- invoice or agreement review.

begin;

alter table public.document_uploads
  add column if not exists current_classification_revision integer not null default 0
    check (current_classification_revision >= 0);

alter table public.document_segments
  add column if not exists classification_revision integer not null default 1
    check (classification_revision > 0);

update public.document_uploads du
set current_classification_revision = 1
where exists (
  select 1 from public.document_segments ds where ds.upload_id = du.id
);

alter table public.document_segments
  drop constraint if exists document_segments_upload_id_segment_index_key,
  drop constraint if exists document_segments_upload_id_page_start_page_end_key;

alter table public.document_segments
  add constraint document_segments_upload_revision_index_key
    unique (upload_id, classification_revision, segment_index),
  add constraint document_segments_upload_revision_pages_key
    unique (upload_id, classification_revision, page_start, page_end);

alter table public.invoice_analyses
  add column if not exists source_classification_revision integer;

alter table public.agreement_analyses
  add column if not exists source_classification_revision integer;

create index idx_document_segments_upload_revision_pages
  on public.document_segments(upload_id, classification_revision, page_start, page_end);

commit;

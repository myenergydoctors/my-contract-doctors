-- Record whether a logical document's printed page sequence is complete.
-- This catches bundles where "Page 1 of 2" is followed by a different invoice.

begin;

alter table public.document_segments
  add column if not exists completeness_status text not null default 'possibly_incomplete'
    check (completeness_status in ('complete', 'possibly_incomplete', 'incomplete')),
  add column if not exists completeness_notes text;

create index if not exists idx_document_segments_completeness
  on public.document_segments(organization_id, completeness_status, detected_type);

commit;

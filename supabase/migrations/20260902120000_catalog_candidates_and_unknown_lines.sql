-- Keep observed/AI catalog candidates separate from approved shared products,
-- and let customers confirm invoice math without identifying every charge.

begin;

alter table public.vendor_products
  add column if not exists catalog_status text;

update public.vendor_products
set catalog_status = case
  when mapping_source in ('seed', 'manual') then 'approved'
  else 'candidate'
end
where catalog_status is null;

alter table public.vendor_products
  alter column catalog_status set default 'candidate',
  alter column catalog_status set not null;

alter table public.vendor_products
  drop constraint if exists vendor_products_catalog_status_check;

alter table public.vendor_products
  add constraint vendor_products_catalog_status_check
  check (catalog_status in ('candidate', 'approved', 'rejected'));

create index if not exists idx_vendor_products_approved_lookup
  on public.vendor_products(vendor_id, source_key)
  where catalog_status = 'approved';

alter table public.invoice_line_items
  add column if not exists identification_status text;

update public.invoice_line_items li
set identification_status = case
  when vp.id is not null and vp.catalog_status = 'approved' then 'matched'
  else 'unclassified'
end
from public.vendor_products vp
where li.vendor_product_id = vp.id
  and li.identification_status is null;

update public.invoice_line_items
set identification_status = 'unclassified'
where identification_status is null;

alter table public.invoice_line_items
  alter column identification_status set default 'unclassified',
  alter column identification_status set not null;

alter table public.invoice_line_items
  drop constraint if exists invoice_line_items_identification_status_check;

alter table public.invoice_line_items
  add constraint invoice_line_items_identification_status_check
  check (identification_status in (
    'matched',
    'unclassified',
    'customer_unsure',
    'pending_review'
  ));

-- Previously observed AI candidates must not silently drive a customer's
-- product identity or recommendation while awaiting catalog approval.
update public.invoice_line_items li
set
  vendor_product_id = null,
  product_id = null,
  mapping_source = 'catalog_candidate',
  mapping_confidence = null,
  identification_status = 'unclassified'
from public.vendor_products vp
where li.vendor_product_id = vp.id
  and vp.catalog_status <> 'approved';

update public.invoice_line_items
set
  product_id = null,
  mapping_source = 'unclassified',
  mapping_confidence = null,
  identification_status = 'unclassified'
where vendor_product_id is null
  and mapping_source = 'ai';

-- Historical retries may have created more than one pending review for the
-- same invoice line. Keep the earliest open item and close the duplicates
-- before enforcing the one-open-review rule.
with ranked_pending_reviews as (
  select
    id,
    row_number() over (
      partition by invoice_line_item_id
      order by created_at asc, id asc
    ) as review_rank
  from public.catalog_review_items
  where status = 'pending'
    and invoice_line_item_id is not null
)
update public.catalog_review_items
set
  status = 'duplicate',
  reviewed_at = now(),
  review_notes = coalesce(review_notes, 'Closed automatically before enforcing one pending review per invoice line.')
where id in (
  select id
  from ranked_pending_reviews
  where review_rank > 1
);

create unique index if not exists idx_catalog_review_items_one_pending_per_line
  on public.catalog_review_items(invoice_line_item_id)
  where status = 'pending' and invoice_line_item_id is not null;

comment on column public.vendor_products.catalog_status is
  'candidate rows are observations only; only approved rows may drive shared product matching';

comment on column public.invoice_line_items.identification_status is
  'separate from financial line type so an unknown charge can remain in totals without driving product comparisons';

commit;

-- =============================================================
-- Seed template: Cintas vendor product catalog
--
-- Fill in the VALUES rows from the known Cintas product-ID list,
-- then run in the Supabase SQL Editor. Idempotent: re-running
-- updates names/mappings of existing codes without duplicating.
--
-- product_slug may be NULL if we don't know the normalized product
-- yet — the code still gets recognized on invoices and can be mapped
-- later in /dashboard/catalog.
-- =============================================================

with seed(vendor_item_code, display_name, product_slug) as (
  values
    -- ('12345',  'Comfort Flex Work Shirt',        'uniform-shirt'),
    -- ('67890',  '3x5 Carpet Mat',                 'floor-mat-3x5'),
    ('__EXAMPLE__', 'Delete this row', null)
)
insert into public.vendor_products
  (vendor_id, vendor_item_code, display_name, product_id, mapping_source, times_seen)
select
  v.id,
  upper(trim(s.vendor_item_code)),
  s.display_name,
  p.id,
  'seed',
  0
from seed s
join public.vendors v on v.slug = 'cintas'
left join public.products p on p.slug = s.product_slug
where s.vendor_item_code <> '__EXAMPLE__'
on conflict (vendor_id, vendor_item_code) do update set
  display_name   = excluded.display_name,
  product_id     = coalesce(excluded.product_id, public.vendor_products.product_id),
  mapping_source = case when excluded.product_id is not null then 'seed' else public.vendor_products.mapping_source end;

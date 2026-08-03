-- =============================================================
-- My Contract Doctors — Phase 2C-2: vendor product catalog
--
-- WHY THIS EXISTS:
-- Vendors bill with their own item codes (Cintas item numbers, etc.).
-- This migration adds a per-vendor SKU catalog so every invoice line
-- can be tied to a stable vendor_item_code. The catalog GROWS ITSELF:
-- the extraction route inserts every code it has never seen, and once
-- a code is mapped to a normalized product (by seed or by hand), that
-- mapping is applied deterministically to all future extractions —
-- the AI no longer has to guess for known codes.
--
-- HOW TO RUN: Supabase SQL Editor → New query → paste → Run.
-- Idempotent — safe to re-run.
-- =============================================================


-- ─── 1. vendor_products: one row per (vendor, item code) ─────

create table if not exists public.vendor_products (
  id                    uuid primary key default gen_random_uuid(),
  vendor_id             uuid not null references public.vendors(id) on delete cascade,
  vendor_item_code      text not null,
  display_name          text,
  product_id            uuid references public.products(id),
  mapping_source        text not null default 'ai'
                        check (mapping_source in ('seed', 'ai', 'manual')),
  first_seen_invoice_id uuid references public.invoice_analyses(id) on delete set null,
  times_seen            int not null default 1,
  last_seen_at          timestamptz not null default now(),
  notes                 text,
  created_at            timestamptz not null default now(),
  unique (vendor_id, vendor_item_code)
);

comment on table  public.vendor_products is
  'Per-vendor SKU catalog. Auto-populated by the extraction route; product_id mapping is the "memory" that makes future extractions deterministic for known codes.';
comment on column public.vendor_products.vendor_item_code is
  'The vendor''s own item/product code exactly as printed on invoices, uppercased and trimmed.';
comment on column public.vendor_products.product_id is
  'Normalized product this SKU maps to. NULL = unmapped, needs review in the catalog UI.';
comment on column public.vendor_products.mapping_source is
  '''seed''=imported from a known catalog list, ''ai''=proposed by extraction, ''manual''=assigned by a human in the catalog UI. manual/seed mappings are never overwritten by AI.';
comment on column public.vendor_products.times_seen is
  'How many invoice line items have carried this code. High-count unmapped codes are the top mapping priority.';

create index if not exists idx_vendor_products_unmapped
  on public.vendor_products(vendor_id, times_seen desc)
  where product_id is null;


-- ─── 2. vendor_item_code on invoice_line_items ───────────────

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_line_items' and column_name = 'vendor_item_code') then
    alter table public.invoice_line_items add column vendor_item_code text;
  end if;
end $$;

comment on column public.invoice_line_items.vendor_item_code is
  'The vendor''s item code as printed on this line, uppercased. Joins to vendor_products(vendor_id, vendor_item_code).';

create index if not exists idx_line_items_vendor_item_code
  on public.invoice_line_items(vendor_id, vendor_item_code)
  where vendor_item_code is not null;


-- ─── 3. RLS ──────────────────────────────────────────────────
-- Reference data: any signed-in user may read. All writes go through
-- server routes using the service_role key (extraction auto-insert and
-- the admin catalog UI), so no insert/update policies for users.

alter table public.vendor_products enable row level security;

drop policy if exists "Authenticated can read vendor products" on public.vendor_products;
create policy "Authenticated can read vendor products"
  on public.vendor_products for select
  to authenticated
  using (true);


-- ─── 4. Grants (auto-expose is off — see supabase-grants-2c.sql) ──

grant select on table public.vendor_products to authenticated;

-- =============================================================
-- My Contract Doctors — Phase 2C-1 Schema additions
--
-- Adds the products taxonomy, normalized vendors table, structured
-- invoice line items, and extraction-job tracking.
--
-- HOW TO RUN:
-- 1. Supabase Dashboard → SQL Editor → + New query
-- 2. Paste this entire file → Run
-- 3. Should see "Success. No rows returned"
-- 4. Check Table Editor: 4 new tables (products, vendors,
--    invoice_line_items, invoice_extraction_jobs) + seeded data
--
-- This file is IDEMPOTENT. Safe to re-run.
-- Pairs with docs/supabase-storage-2c.sql for storage bucket setup.
-- =============================================================


-- ─── 1. Products taxonomy ────────────────────────────────────
-- Normalized catalog of products billed by uniform/linen vendors. The AI
-- extraction step maps each raw invoice line to a product_id here so we
-- can aggregate prices across vendors and customers.

create table if not exists public.products (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  category            text not null check (category in ('uniforms', 'linens', 'mats', 'restroom', 'shop', 'industrial', 'fees', 'other')),
  subcategory         text,
  common_billing_unit text check (common_billing_unit in ('per-item-per-week', 'per-item-per-month', 'per-pound', 'per-event', 'flat-monthly', 'per-occurrence')),
  description         text,
  created_at          timestamptz not null default now()
);

comment on table  public.products is 'Normalized product taxonomy. Every invoice line item maps to one of these for cross-customer aggregation.';
comment on column public.products.slug is 'Stable URL-safe identifier — use this as the key in code, not the UUID.';


-- ─── 2. Vendors ──────────────────────────────────────────────
-- Normalized list of service providers. The aliases column handles invoice
-- variants like "Cintas Corp #5678" → vendor slug 'cintas'.

create table if not exists public.vendors (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  parent_company  text,
  aliases         text[] not null default array[]::text[],
  website         text,
  notes           text,
  created_at      timestamptz not null default now()
);

comment on column public.vendors.aliases is 'String list of name variants the AI should also recognize as this vendor.';


-- ─── 3. Add columns to existing invoice_analyses ─────────────
-- Denormalize state/zip/vendor_id onto the invoice for fast filtering.

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'vendor_id') then
    alter table public.invoice_analyses add column vendor_id uuid references public.vendors(id);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'state') then
    alter table public.invoice_analyses add column state text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'zip') then
    alter table public.invoice_analyses add column zip text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'invoice_analyses' and column_name = 'invoice_date') then
    alter table public.invoice_analyses add column invoice_date date;
  end if;
end $$;


-- ─── 4. invoice_line_items ───────────────────────────────────
-- One row per line item across every customer's invoice. THIS is the
-- aggregation surface — benchmarks query this table.

create table if not exists public.invoice_line_items (
  id                   uuid primary key default gen_random_uuid(),
  invoice_id           uuid not null references public.invoice_analyses(id) on delete cascade,
  user_id              uuid not null references auth.users on delete cascade,
  raw_label            text not null,
  product_id           uuid references public.products(id),
  vendor_id            uuid references public.vendors(id),
  quantity             numeric,
  unit_price_cents     bigint,
  billing_frequency    text check (billing_frequency in ('per-event', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'annual', 'one-time')),
  annual_cost_cents    bigint,
  state                text,
  zip                  text,
  flagged              boolean not null default false,
  flag_reason          text,
  flag_severity        text check (flag_severity in ('high', 'medium', 'low')),
  suggested_action     text,
  estimated_savings_cents bigint,
  extracted_at         timestamptz not null default now()
);

comment on table  public.invoice_line_items is 'One row per line on a customer invoice. Normalized via product_id + vendor_id so we can aggregate across customers for benchmarks.';
comment on column public.invoice_line_items.raw_label is 'Verbatim text from the invoice. Useful when our taxonomy mapping isn''t perfect.';
comment on column public.invoice_line_items.user_id is 'Denormalized from invoice_analyses for RLS — every row belongs to exactly one user.';


-- ─── 5. invoice_extraction_jobs ──────────────────────────────
-- Tracks AI extraction lifecycle: queued → processing → completed/failed.
-- Even when we process synchronously, this gives us retry + cost
-- observability + debug logs.

create table if not exists public.invoice_extraction_jobs (
  id                uuid primary key default gen_random_uuid(),
  invoice_id        uuid not null references public.invoice_analyses(id) on delete cascade,
  user_id           uuid not null references auth.users on delete cascade,
  status            text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  attempts          int not null default 0,
  started_at        timestamptz,
  completed_at      timestamptz,
  error_message     text,
  raw_ai_response   jsonb,
  ai_model          text,
  ai_tokens_input   int,
  ai_tokens_output  int,
  ai_cost_cents     int,
  created_at        timestamptz not null default now()
);


-- ─── 6. RLS ──────────────────────────────────────────────────

-- Products + vendors are public read (they're reference data)
alter table public.products enable row level security;
alter table public.vendors  enable row level security;

drop policy if exists "Anyone can read products" on public.products;
drop policy if exists "Anyone can read vendors"  on public.vendors;
create policy "Anyone can read products" on public.products for select using (true);
create policy "Anyone can read vendors"  on public.vendors  for select using (true);

-- Line items: users see only their own
alter table public.invoice_line_items enable row level security;
drop policy if exists "Users can view own line items"   on public.invoice_line_items;
drop policy if exists "Users can insert own line items" on public.invoice_line_items;
drop policy if exists "Users can update own line items" on public.invoice_line_items;
drop policy if exists "Users can delete own line items" on public.invoice_line_items;
create policy "Users can view own line items"   on public.invoice_line_items for select using (auth.uid() = user_id);
create policy "Users can insert own line items" on public.invoice_line_items for insert with check (auth.uid() = user_id);
create policy "Users can update own line items" on public.invoice_line_items for update using (auth.uid() = user_id);
create policy "Users can delete own line items" on public.invoice_line_items for delete using (auth.uid() = user_id);

-- Extraction jobs: users can read their own (for status polling) but writes
-- are server-side only with service_role
alter table public.invoice_extraction_jobs enable row level security;
drop policy if exists "Users can view own extraction jobs" on public.invoice_extraction_jobs;
create policy "Users can view own extraction jobs" on public.invoice_extraction_jobs for select using (auth.uid() = user_id);


-- ─── 7. Indexes ──────────────────────────────────────────────

create index if not exists idx_invoice_line_items_invoice_id  on public.invoice_line_items(invoice_id);
create index if not exists idx_invoice_line_items_user_id     on public.invoice_line_items(user_id);
create index if not exists idx_invoice_line_items_product     on public.invoice_line_items(product_id) where product_id is not null;
create index if not exists idx_invoice_line_items_vendor      on public.invoice_line_items(vendor_id) where vendor_id is not null;
create index if not exists idx_invoice_line_items_benchmark   on public.invoice_line_items(product_id, vendor_id, state) where product_id is not null and vendor_id is not null;
create index if not exists idx_invoice_line_items_flagged     on public.invoice_line_items(user_id, flagged) where flagged = true;

create index if not exists idx_extraction_jobs_invoice  on public.invoice_extraction_jobs(invoice_id);
create index if not exists idx_extraction_jobs_status   on public.invoice_extraction_jobs(status, created_at desc) where status in ('queued', 'processing');

create index if not exists idx_vendors_aliases on public.vendors using gin(aliases);


-- ─── 8. Seed: vendors ────────────────────────────────────────

insert into public.vendors (slug, name, parent_company, aliases, website) values
  ('cintas',          'Cintas',                       null,     array['Cintas Corp', 'Cintas Corporation', 'Cintas Uniforms', 'Cintas Document Management'], 'https://www.cintas.com'),
  ('unifirst',        'UniFirst',                     null,     array['UniFirst Corp', 'UniFirst Corporation', 'UniFirst Uniforms'], 'https://www.unifirst.com'),
  ('alsco',           'ALSCO',                        null,     array['ALSCO Inc', 'ALSCO Uniforms', 'ALSCO American Linen', 'American Linen'], 'https://www.alsco.com'),
  ('imagefirst',      'ImageFirst',                   null,     array['ImageFirst Healthcare Laundry', 'ImageFirst Laundry', 'Image First'], 'https://www.imagefirst.com'),
  ('aramark',         'Aramark Uniform Services',     'Aramark', array['Aramark Uniform & Career Apparel', 'Aramark Uniforms', 'AUS'], 'https://www.aramarkuniform.com'),
  ('gandk',           'G&K Services',                 'Cintas',  array['G&K', 'G & K Services', 'GandK', 'Cintas G&K'], null),
  ('mission-linen',   'Mission Linen Supply',         null,      array['Mission Linen', 'Mission Linen Services'], null),
  ('mac-mor',         'Mac-Mor Industries',           null,      array['MacMor', 'Mac Mor'], null),
  ('paris-uniforms',  'Paris Uniforms',               null,      array['Paris Companies', 'Paris Uniform Rental'], null),
  ('national-service','National Service Industries', null,       array['NSI Linens'], null),
  ('roscoe-medical',  'Roscoe Medical',               null,      array['Roscoe Medical Uniforms'], null),
  ('service-linen',   'Service Linen Supply',         null,      array['Service Linen'], null),
  ('crown-linen',     'Crown Holdings (Linen)',       null,      array['Crown Linen', 'Crown Holdings'], null),
  ('park-place',      'Park Place Uniforms',          null,      array['Park Place Cleaners'], null),
  ('berstein-magoon-gay','Berstein-Magoon-Gay LLC',   'ImageFirst', array['BMG', 'BMG LLC'], null),
  ('hcsg',            'Healthcare Services Group',    null,      array['HCSG Linen', 'HCSG'], null),
  ('prudential-overall','Prudential Overall Supply',  null,      array['Prudential Uniform', 'POS'], null),
  ('regalwear',       'RegalWear',                    null,      array['Regal Wear', 'Regal Uniforms'], null),
  ('other',           'Other / Unknown',              null,      array['Unknown', 'Other'], null)
on conflict (slug) do nothing;


-- ─── 9. Seed: products ───────────────────────────────────────

-- Uniforms
insert into public.products (slug, name, category, subcategory, common_billing_unit, description) values
  ('apron-cotton',          'Cotton apron',                 'uniforms', 'aprons',     'per-item-per-week', 'Standard cotton bib or waist apron, kitchen / restaurant'),
  ('apron-poly',            'Poly apron',                   'uniforms', 'aprons',     'per-item-per-week', 'Polyester apron, kitchen / service'),
  ('apron-logo',            'Logo apron',                   'uniforms', 'aprons',     'per-item-per-week', 'Apron with embroidered or screen-printed logo'),
  ('shirt-buttondown',      'Button-down shirt',            'uniforms', 'tops',       'per-item-per-week', 'Standard button-down work shirt'),
  ('shirt-polo',            'Polo shirt',                   'uniforms', 'tops',       'per-item-per-week', 'Standard polo work shirt'),
  ('shirt-mechanic',        'Mechanic shirt',               'uniforms', 'tops',       'per-item-per-week', 'Button-front mechanic shirt with name patch'),
  ('pants-cotton',          'Cotton pants',                 'uniforms', 'bottoms',    'per-item-per-week', 'Standard cotton work pants'),
  ('pants-mechanic',        'Mechanic pants',               'uniforms', 'bottoms',    'per-item-per-week', 'Industrial mechanic / shop pants'),
  ('pants-fr',              'Flame-resistant pants',        'uniforms', 'bottoms',    'per-item-per-week', 'FR-rated work pants'),
  ('coverall-cotton',       'Cotton coverall',              'uniforms', 'coveralls',  'per-item-per-week', 'Standard cotton coverall'),
  ('coverall-fr',           'Flame-resistant coverall',     'uniforms', 'coveralls',  'per-item-per-week', 'FR-rated coverall, oil/gas/industrial'),
  ('scrub-top',             'Scrub top',                    'uniforms', 'medical',    'per-item-per-week', 'Medical scrub top'),
  ('scrub-bottom',          'Scrub bottoms',                'uniforms', 'medical',    'per-item-per-week', 'Medical scrub pants'),
  ('lab-coat',              'Lab coat',                     'uniforms', 'medical',    'per-item-per-week', 'White lab coat or jacket'),
  ('chef-coat',             'Chef coat',                    'uniforms', 'kitchen',    'per-item-per-week', 'Double-breasted chef coat'),
  ('chef-pants',            'Chef pants',                   'uniforms', 'kitchen',    'per-item-per-week', 'Houndstooth or solid chef pants')
on conflict (slug) do nothing;

-- Floor mats
insert into public.products (slug, name, category, subcategory, common_billing_unit, description) values
  ('mat-entry-3x5',         'Entry mat 3x5',                'mats',     'entry',      'per-item-per-week', 'Standard entry mat, 3 ft × 5 ft'),
  ('mat-entry-4x6',         'Entry mat 4x6',                'mats',     'entry',      'per-item-per-week', 'Larger entry mat, 4 ft × 6 ft'),
  ('mat-entry-4x8',         'Entry mat 4x8',                'mats',     'entry',      'per-item-per-week', 'Large entry mat, 4 ft × 8 ft'),
  ('mat-logo-3x5',          'Logo mat 3x5',                 'mats',     'entry',      'per-item-per-week', 'Branded entry mat with custom logo, 3x5'),
  ('mat-logo-4x6',          'Logo mat 4x6',                 'mats',     'entry',      'per-item-per-week', 'Branded entry mat with custom logo, 4x6'),
  ('mat-antifatigue',       'Anti-fatigue mat',             'mats',     'kitchen',    'per-item-per-week', 'Cushioned mat for stand-up workstations'),
  ('mat-antislip-kitchen',  'Anti-slip kitchen mat',        'mats',     'kitchen',    'per-item-per-week', 'Drainage mat for kitchen line / dishpit'),
  ('mat-urinal-screen',     'Urinal screen / mat',          'mats',     'restroom',   'per-item-per-week', 'Urinal floor mat or deodorizing screen')
on conflict (slug) do nothing;

-- Linens
insert into public.products (slug, name, category, subcategory, common_billing_unit, description) values
  ('linen-tablecloth-sm',   'Tablecloth (small)',           'linens',   'table',      'per-item-per-week', 'Restaurant tablecloth, ~52 in square'),
  ('linen-tablecloth-md',   'Tablecloth (medium)',          'linens',   'table',      'per-item-per-week', 'Restaurant tablecloth, ~72 in square'),
  ('linen-tablecloth-lg',   'Tablecloth (large)',           'linens',   'table',      'per-item-per-week', 'Banquet tablecloth, large'),
  ('linen-napkin',          'Cloth napkin',                 'linens',   'table',      'per-item-per-week', 'Restaurant cloth napkin'),
  ('linen-bath-towel',      'Bath towel',                   'linens',   'hospitality','per-item-per-week', 'Hotel / spa bath towel'),
  ('linen-hand-towel',      'Hand towel',                   'linens',   'hospitality','per-item-per-week', 'Bathroom hand towel'),
  ('linen-dish-towel',      'Dish towel',                   'linens',   'kitchen',    'per-item-per-week', 'Kitchen dish / bar towel'),
  ('linen-bed-set',         'Bed linen set',                'linens',   'hospitality','per-item-per-week', 'Sheets + pillowcase set, hotel use'),
  ('linen-surgical',        'Surgical linen',               'linens',   'medical',    'per-pound',         'Hospital surgical linens, billed per pound')
on conflict (slug) do nothing;

-- Shop / industrial
insert into public.products (slug, name, category, subcategory, common_billing_unit, description) values
  ('shop-towel-red',        'Shop towel (red)',             'shop',     'towels',     'per-item-per-week', 'Red shop towel, mechanic / automotive'),
  ('shop-towel-white',      'Shop towel (white)',           'shop',     'towels',     'per-item-per-week', 'White shop towel'),
  ('shop-rag-bulk',         'Shop rags (bulk)',             'shop',     'towels',     'flat-monthly',      'Bulk shop rag delivery'),
  ('mop-yarn',              'Mop head (yarn)',              'shop',     'cleaning',   'per-item-per-week', 'Yarn / cotton mop head'),
  ('mop-microfiber',        'Mop head (microfiber)',        'shop',     'cleaning',   'per-item-per-week', 'Microfiber mop head'),
  ('microfiber-cloth',      'Microfiber cleaning cloth',    'shop',     'cleaning',   'per-item-per-week', 'Microfiber cleaning cloths'),
  ('absorbent-pad',         'Absorbent pad / spill control','industrial','spill',     'flat-monthly',      'Absorbent pads for industrial spill control')
on conflict (slug) do nothing;

-- Restroom services
insert into public.products (slug, name, category, subcategory, common_billing_unit, description) values
  ('restroom-soap',         'Hand soap dispenser service',  'restroom', 'dispensers', 'flat-monthly',      'Hand soap dispenser refill + service'),
  ('restroom-paper-towel',  'Paper towel dispenser service','restroom', 'dispensers', 'flat-monthly',      'Paper towel dispenser refill + service'),
  ('restroom-air-freshener','Air freshener service',        'restroom', 'dispensers', 'flat-monthly',      'Restroom air freshener / scent dispenser'),
  ('restroom-sanitizer',    'Hand sanitizer dispenser',     'restroom', 'dispensers', 'flat-monthly',      'Hand sanitizer dispenser refill + service'),
  ('restroom-mat',          'Restroom floor mat',           'restroom', 'mats',       'per-item-per-week', 'Restroom-specific floor mat'),
  ('restroom-feminine',     'Feminine hygiene service',     'restroom', 'dispensers', 'flat-monthly',      'Feminine hygiene disposal + service')
on conflict (slug) do nothing;

-- Fees / surcharges (so we can flag these specifically)
insert into public.products (slug, name, category, subcategory, common_billing_unit, description) values
  ('fee-fuel-surcharge',    'Fuel surcharge',               'fees',     'surcharge',  'per-occurrence',    'Per-delivery fuel surcharge — frequently flagged as unauthorized add-on'),
  ('fee-environmental',     'Environmental fee',            'fees',     'surcharge',  'per-occurrence',    'Environmental / energy surcharge'),
  ('fee-facility-service',  'Facility service charge',      'fees',     'surcharge',  'flat-monthly',      'Vague catch-all facility service charge — often disputable'),
  ('fee-loss-damage',       'Loss / damage charge',         'fees',     'charge',     'per-occurrence',    'Replacement charge for lost or damaged items'),
  ('fee-delivery',          'Delivery fee',                 'fees',     'charge',     'per-occurrence',    'Per-delivery base fee'),
  ('fee-pickup',            'Pickup fee',                   'fees',     'charge',     'per-occurrence',    'Per-pickup fee'),
  ('fee-administrative',    'Administrative fee',           'fees',     'surcharge',  'flat-monthly',      'Admin / processing fee'),
  ('fee-minimum-billing',   'Minimum billing adjustment',   'fees',     'charge',     'flat-monthly',      'Charge to bring invoice up to contractual minimum')
on conflict (slug) do nothing;


-- =============================================================
-- DONE. Verify:
-- - 4 new tables: products (~50 rows), vendors (~19 rows),
--   invoice_line_items (empty), invoice_extraction_jobs (empty)
-- - invoice_analyses now has vendor_id, state, zip, invoice_date columns
--
-- Next: run docs/supabase-storage-2c.sql to set up the file storage
-- bucket policies, then we wire up the upload + extraction code.
-- =============================================================

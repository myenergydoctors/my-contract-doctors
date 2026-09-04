-- Additive vendor catalog categories, flexible attributes, and versioned
-- price-list storage. Existing extraction upsert behavior remains unchanged.

begin;

create table public.product_categories (
  id                  uuid primary key default gen_random_uuid(),
  parent_category_id  uuid references public.product_categories(id) on delete restrict,
  slug                text not null unique,
  name                text not null check (length(btrim(name)) > 0),
  description         text,
  display_order       integer not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (parent_category_id is null or parent_category_id <> id)
);

create table public.vendor_categories (
  id                    uuid primary key default gen_random_uuid(),
  vendor_id             uuid not null references public.vendors(id) on delete cascade,
  parent_category_id    uuid references public.vendor_categories(id) on delete restrict,
  product_category_id   uuid references public.product_categories(id) on delete set null,
  source_key            text,
  name                  text not null check (length(btrim(name)) > 0),
  source                text not null default 'manual'
                        check (source in ('vendor', 'imported', 'inferred', 'manual')),
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (parent_category_id is null or parent_category_id <> id)
);

create unique index idx_vendor_categories_source_key
  on public.vendor_categories(vendor_id, source_key)
  where source_key is not null;

create table public.category_attribute_definitions (
  id                        uuid primary key default gen_random_uuid(),
  product_category_id       uuid not null references public.product_categories(id) on delete cascade,
  attribute_key             text not null,
  display_label             text not null,
  data_type                 text not null
                            check (data_type in ('text', 'number', 'boolean', 'enum', 'measurement', 'range')),
  unit_family               text,
  allowed_values            jsonb not null default '[]'::jsonb,
  required_for_comparison   boolean not null default false,
  is_comparable             boolean not null default true,
  display_order             integer not null default 0,
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (product_category_id, attribute_key),
  check (jsonb_typeof(allowed_values) = 'array')
);

insert into public.product_categories (slug, name, display_order)
values
  ('uniforms', 'Uniforms', 10),
  ('linens', 'Linens', 20),
  ('mats', 'Mats', 30),
  ('restroom', 'Restroom', 40),
  ('shop', 'Shop supplies', 50),
  ('industrial', 'Industrial', 60),
  ('fees', 'Fees and services', 70),
  ('other', 'Other', 999)
on conflict (slug) do nothing;

-- The existing product_id column and unique(vendor_id, vendor_item_code)
-- constraint remain until extraction matching is migrated in a coordinated
-- application release.
alter table public.vendor_products
  add column if not exists vendor_category_id uuid
    references public.vendor_categories(id) on delete set null,
  add column if not exists product_category_id uuid
    references public.product_categories(id) on delete set null,
  add column if not exists description text,
  add column if not exists billing_unit text,
  add column if not exists attributes jsonb not null default '{}'::jsonb,
  add column if not exists source_key text,
  add column if not exists source_type text,
  add column if not exists source_reference text,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_vendor_products_source_key
  on public.vendor_products(vendor_id, source_key)
  where source_key is not null;
create index if not exists idx_vendor_products_vendor_category
  on public.vendor_products(vendor_id, vendor_category_id);
create index if not exists idx_vendor_products_product_category
  on public.vendor_products(product_category_id)
  where product_category_id is not null;
create index if not exists idx_vendor_products_attributes
  on public.vendor_products using gin(attributes);

create table public.vendor_price_lists (
  id                    uuid primary key default gen_random_uuid(),
  vendor_id             uuid not null references public.vendors(id) on delete restrict,
  organization_id       uuid references public.organizations(id) on delete cascade,
  agreement_id          uuid references public.agreement_analyses(id) on delete set null,
  name                  text not null check (length(btrim(name)) > 0),
  scope                 text not null default 'other'
                        check (scope in ('public_contract', 'customer_contract', 'quote', 'other')),
  contract_reference    text,
  effective_from        date,
  effective_to          date,
  territories           text[] not null default array[]::text[],
  currency_code         text not null default 'USD' check (length(currency_code) = 3),
  version_label         text,
  source_document_path  text,
  source_metadata       jsonb not null default '{}'::jsonb,
  status                text not null default 'draft'
                        check (status in ('draft', 'active', 'expired', 'archived')),
  created_by            uuid references auth.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table public.vendor_price_list_items (
  id                    uuid primary key default gen_random_uuid(),
  price_list_id         uuid not null references public.vendor_price_lists(id) on delete cascade,
  vendor_product_id     uuid references public.vendor_products(id) on delete set null,
  source_sheet          text,
  source_row            integer check (source_row is null or source_row > 0),
  source_item_code      text,
  source_description    text,
  source_category       text,
  source_attributes     jsonb not null default '{}'::jsonb,
  minimum_percentage    numeric(9, 6),
  raw_source_data       jsonb not null default '{}'::jsonb,
  match_status          text not null default 'unmatched'
                        check (match_status in ('unmatched', 'suggested', 'confirmed', 'rejected')),
  match_confidence      numeric(5, 4)
                        check (match_confidence is null or match_confidence between 0 and 1),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (price_list_id, source_sheet, source_row)
);

create table public.vendor_price_list_rates (
  id                    uuid primary key default gen_random_uuid(),
  price_list_item_id    uuid not null references public.vendor_price_list_items(id) on delete cascade,
  rate_type             text not null
                        check (rate_type in ('rental', 'replacement', 'sale', 'wash', 'delivery', 'other')),
  amount                numeric(18, 6) not null check (amount >= 0),
  billing_basis         text,
  service_frequency     text,
  conditions            jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create index idx_vendor_price_lists_vendor_dates
  on public.vendor_price_lists(vendor_id, status, effective_from, effective_to);
create index idx_vendor_price_lists_organization
  on public.vendor_price_lists(organization_id)
  where organization_id is not null;
create index idx_vendor_price_list_items_product
  on public.vendor_price_list_items(vendor_product_id)
  where vendor_product_id is not null;
create index idx_vendor_price_list_items_unmatched
  on public.vendor_price_list_items(price_list_id, match_status, source_row)
  where match_status <> 'confirmed';
create index idx_vendor_price_list_rates_item
  on public.vendor_price_list_rates(price_list_item_id, rate_type);

create trigger set_product_categories_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();
create trigger set_vendor_categories_updated_at
  before update on public.vendor_categories
  for each row execute function public.set_updated_at();
create trigger set_category_attribute_definitions_updated_at
  before update on public.category_attribute_definitions
  for each row execute function public.set_updated_at();
create trigger set_vendor_products_updated_at
  before update on public.vendor_products
  for each row execute function public.set_updated_at();
create trigger set_vendor_price_lists_updated_at
  before update on public.vendor_price_lists
  for each row execute function public.set_updated_at();
create trigger set_vendor_price_list_items_updated_at
  before update on public.vendor_price_list_items
  for each row execute function public.set_updated_at();

alter table public.product_categories enable row level security;
alter table public.vendor_categories enable row level security;
alter table public.category_attribute_definitions enable row level security;
alter table public.vendor_price_lists enable row level security;
alter table public.vendor_price_list_items enable row level security;
alter table public.vendor_price_list_rates enable row level security;

create policy "Authenticated can read product categories"
  on public.product_categories for select to authenticated using (true);
create policy "Authenticated can read vendor categories"
  on public.vendor_categories for select to authenticated using (true);
create policy "Authenticated can read category attributes"
  on public.category_attribute_definitions for select to authenticated using (true);

create policy "Members can read applicable price lists"
  on public.vendor_price_lists for select to authenticated
  using (
    organization_id is null
    or public.is_organization_member(organization_id)
  );

create policy "Members can read applicable price list items"
  on public.vendor_price_list_items for select to authenticated
  using (
    exists (
      select 1
      from public.vendor_price_lists vpl
      where vpl.id = price_list_id
        and (
          vpl.organization_id is null
          or public.is_organization_member(vpl.organization_id)
        )
    )
  );

create policy "Members can read applicable price list rates"
  on public.vendor_price_list_rates for select to authenticated
  using (
    exists (
      select 1
      from public.vendor_price_list_items vpli
      join public.vendor_price_lists vpl on vpl.id = vpli.price_list_id
      where vpli.id = price_list_item_id
        and (
          vpl.organization_id is null
          or public.is_organization_member(vpl.organization_id)
        )
    )
  );

grant select on table
  public.product_categories,
  public.vendor_categories,
  public.category_attribute_definitions,
  public.vendor_price_lists,
  public.vendor_price_list_items,
  public.vendor_price_list_rates
to authenticated;

grant select, insert, update, delete on table
  public.product_categories,
  public.vendor_categories,
  public.category_attribute_definitions,
  public.vendor_price_lists,
  public.vendor_price_list_items,
  public.vendor_price_list_rates
to service_role;

commit;

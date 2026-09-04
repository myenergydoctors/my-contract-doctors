-- Additive cross-vendor comparison groups and auditable estimate scenarios.

begin;

create table public.comparison_groups (
  id                    uuid primary key default gen_random_uuid(),
  product_category_id   uuid not null references public.product_categories(id) on delete restrict,
  name                  text not null check (length(btrim(name)) > 0),
  specification         jsonb not null default '{}'::jsonb,
  status                text not null default 'draft'
                        check (status in ('draft', 'active', 'archived')),
  created_by            uuid references auth.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table public.comparison_group_members (
  id                    uuid primary key default gen_random_uuid(),
  comparison_group_id   uuid not null references public.comparison_groups(id) on delete cascade,
  vendor_product_id     uuid not null references public.vendor_products(id) on delete cascade,
  match_type            text not null
                        check (match_type in ('exact', 'equivalent', 'near_equivalent')),
  confidence            numeric(5, 4) not null
                        check (confidence between 0 and 1),
  mapping_source        text not null
                        check (mapping_source in ('rule', 'ai', 'manual', 'customer_feedback')),
  difference_notes      text,
  confirmed_by          uuid references auth.users(id) on delete set null,
  confirmed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (comparison_group_id, vendor_product_id)
);

create table public.comparison_scenarios (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  source_invoice_id       uuid not null references public.invoice_analyses(id) on delete cascade,
  target_vendor_id        uuid not null references public.vendors(id) on delete restrict,
  target_price_list_id    uuid references public.vendor_price_lists(id) on delete set null,
  status                  text not null default 'draft'
                          check (status in ('draft', 'calculating', 'completed', 'failed', 'superseded')),
  current_total_cents     bigint,
  projected_total_cents   bigint,
  projected_savings_cents bigint,
  matched_amount_cents    bigint,
  unmatched_amount_cents  bigint,
  coverage_percentage     numeric(7, 4)
                          check (coverage_percentage is null or coverage_percentage between 0 and 100),
  price_confidence        text
                          check (price_confidence is null or price_confidence in ('high', 'medium', 'low')),
  assumptions             jsonb not null default '{}'::jsonb,
  created_by              uuid references auth.users(id) on delete set null,
  created_at              timestamptz not null default now(),
  completed_at            timestamptz,
  updated_at              timestamptz not null default now()
);

create table public.comparison_scenario_lines (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations(id) on delete cascade,
  scenario_id               uuid not null references public.comparison_scenarios(id) on delete cascade,
  source_line_item_id       uuid not null references public.invoice_line_items(id) on delete cascade,
  source_vendor_product_id  uuid references public.vendor_products(id) on delete set null,
  target_vendor_product_id  uuid references public.vendor_products(id) on delete set null,
  target_rate_id            uuid references public.vendor_price_list_rates(id) on delete set null,
  match_type                text
                            check (match_type is null or match_type in ('exact', 'equivalent', 'near_equivalent', 'unmatched')),
  quantity                  numeric,
  billing_frequency         text,
  source_unit_rate          numeric(18, 6),
  target_unit_rate          numeric(18, 6),
  current_annual_cents      bigint,
  projected_annual_cents    bigint,
  difference_cents          bigint,
  confidence                numeric(5, 4)
                            check (confidence is null or confidence between 0 and 1),
  assumptions               jsonb not null default '{}'::jsonb,
  exclusion_reason          text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (scenario_id, source_line_item_id)
);

create index idx_comparison_group_members_product
  on public.comparison_group_members(vendor_product_id, match_type);
create index idx_comparison_scenarios_organization
  on public.comparison_scenarios(organization_id, created_at desc);
create index idx_comparison_scenario_lines_scenario
  on public.comparison_scenario_lines(scenario_id, source_line_item_id);

create trigger set_comparison_groups_updated_at
  before update on public.comparison_groups
  for each row execute function public.set_updated_at();
create trigger set_comparison_group_members_updated_at
  before update on public.comparison_group_members
  for each row execute function public.set_updated_at();
create trigger set_comparison_scenarios_updated_at
  before update on public.comparison_scenarios
  for each row execute function public.set_updated_at();
create trigger set_comparison_scenario_lines_updated_at
  before update on public.comparison_scenario_lines
  for each row execute function public.set_updated_at();

alter table public.comparison_groups enable row level security;
alter table public.comparison_group_members enable row level security;
alter table public.comparison_scenarios enable row level security;
alter table public.comparison_scenario_lines enable row level security;

create policy "Authenticated can read comparison groups"
  on public.comparison_groups for select to authenticated
  using (status = 'active');

create policy "Authenticated can read comparison members"
  on public.comparison_group_members for select to authenticated
  using (
    exists (
      select 1
      from public.comparison_groups cg
      where cg.id = comparison_group_id
        and cg.status = 'active'
    )
  );

create policy "Members can view comparison scenarios"
  on public.comparison_scenarios for select to authenticated
  using (public.is_organization_member(organization_id));

create policy "Members can view comparison scenario lines"
  on public.comparison_scenario_lines for select to authenticated
  using (public.is_organization_member(organization_id));

grant select on table
  public.comparison_groups,
  public.comparison_group_members,
  public.comparison_scenarios,
  public.comparison_scenario_lines
to authenticated;

grant select, insert, update, delete on table
  public.comparison_groups,
  public.comparison_group_members,
  public.comparison_scenarios,
  public.comparison_scenario_lines
to service_role;

commit;

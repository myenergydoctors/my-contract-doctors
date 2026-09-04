-- Additive organization ownership foundation.
-- Existing user_id ownership remains active until application reads and RLS
-- policies are migrated in a later coordinated release.

begin;

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) > 0),
  legal_name  text,
  industry    text,
  status      text not null default 'active'
              check (status in ('active', 'suspended', 'closed')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.organization_members (
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  role              text not null default 'member'
                    check (role in ('owner', 'admin', 'member', 'viewer')),
  status            text not null default 'active'
                    check (status in ('invited', 'active', 'disabled')),
  joined_at         timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.profiles
  add column if not exists default_organization_id uuid
    references public.organizations(id) on delete set null;

-- Existing user UUIDs become deterministic initial organization UUIDs.
insert into public.organizations (id, name, legal_name, industry, created_by)
select
  p.id,
  coalesce(
    nullif(btrim(p.business_name), ''),
    nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), ''),
    'My organization'
  ),
  nullif(btrim(p.business_name), ''),
  p.industry,
  p.id
from public.profiles p
on conflict (id) do nothing;

insert into public.organization_members (organization_id, user_id, role, status)
select p.id, p.id, 'owner', 'active'
from public.profiles p
on conflict (organization_id, user_id) do nothing;

update public.profiles
set default_organization_id = id
where default_organization_id is null;

create table public.locations (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null check (length(btrim(name)) > 0),
  location_type     text not null default 'service'
                    check (location_type in ('headquarters', 'service', 'billing', 'other')),
  address_line_1    text,
  address_line_2    text,
  city              text,
  state_region      text,
  postal_code       text,
  country_code      text not null default 'US' check (length(country_code) = 2),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.organization_vendors (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  vendor_id             uuid not null references public.vendors(id) on delete restrict,
  vendor_account_number text,
  relationship_status   text not null default 'active'
                        check (relationship_status in ('prospect', 'active', 'former')),
  representative_name   text,
  representative_email  text,
  representative_phone  text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_organization_members_user
  on public.organization_members(user_id, status, organization_id);
create index idx_locations_organization
  on public.locations(organization_id, is_active, name);
create index idx_organization_vendors_organization
  on public.organization_vendors(organization_id, vendor_id);

create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

revoke all on function public.is_organization_member(uuid)
  from public, anon;
grant execute on function public.is_organization_member(uuid)
  to authenticated, service_role;

-- Create a profile, organization, and owner membership atomically for new users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization_name text;
begin
  organization_name := coalesce(
    nullif(btrim(new.raw_user_meta_data->>'business_name'), ''),
    nullif(btrim(concat_ws(
      ' ',
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'last_name'
    )), ''),
    'My organization'
  );

  insert into public.organizations (id, name, legal_name, created_by)
  values (
    new.id,
    organization_name,
    nullif(btrim(new.raw_user_meta_data->>'business_name'), ''),
    new.id
  )
  on conflict (id) do nothing;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    business_name,
    default_organization_id
  ) values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'business_name',
    new.id
  )
  on conflict (id) do nothing;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (new.id, new.id, 'owner', 'active')
  on conflict (organization_id, user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user()
  from public, anon, authenticated;

create trigger set_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger set_organization_members_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();
create trigger set_locations_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();
create trigger set_organization_vendors_updated_at
  before update on public.organization_vendors
  for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.locations enable row level security;
alter table public.organization_vendors enable row level security;

create policy "Members can view organizations"
  on public.organizations for select
  to authenticated
  using (public.is_organization_member(id));

create policy "Members can view organization members"
  on public.organization_members for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "Members can view locations"
  on public.locations for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "Members can view organization vendors"
  on public.organization_vendors for select
  to authenticated
  using (public.is_organization_member(organization_id));

grant select on table
  public.organizations,
  public.organization_members,
  public.locations,
  public.organization_vendors
to authenticated;

grant select, insert, update, delete on table
  public.organizations,
  public.organization_members,
  public.locations,
  public.organization_vendors
to service_role;

commit;

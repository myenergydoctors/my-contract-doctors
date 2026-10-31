-- Account deactivation retains customer data while disabling account access.
-- Target only OSC Web Design / My Contract Doctors (xrchncayomnwcnphrwhx).
begin;

alter table public.profiles add column if not exists deactivated_at timestamptz;

create table public.account_deactivation_challenges (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_hash text not null check (token_hash ~ '^[a-f0-9]{64}$'),
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create table public.account_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('deactivation_requested', 'deactivated', 'auth_ban_failed', 'password_reset', 'password_changed')),
  created_at timestamptz not null default now()
);
create index account_lifecycle_events_user_time on public.account_lifecycle_events(user_id, created_at desc);

alter table public.account_deactivation_challenges enable row level security;
alter table public.account_lifecycle_events enable row level security;
revoke all on public.account_deactivation_challenges, public.account_lifecycle_events from public, anon, authenticated;
grant select, insert, update, delete on public.account_deactivation_challenges to service_role;
grant select, insert on public.account_lifecycle_events to service_role;

create or replace function public.account_is_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.deactivated_at is null
  );
$$;
revoke all on function public.account_is_active() from public;
grant execute on function public.account_is_active() to anon, authenticated, service_role;

-- Organization-owned records are guarded through this shared membership function.
create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.account_is_active() and exists (
    select 1 from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

-- Add the active-account guard to existing user-owned RLS policies. This
-- includes storage policies that use auth.uid() to authorize document paths.
-- Public catalog policies without user ownership are left as they are.
do $$
declare p record;
declare table_name text;
declare guarded_using text;
declare guarded_check text;
begin
  for p in
    select schemaname, tablename, policyname, cmd, qual, with_check
    from pg_policies
    where schemaname in ('public', 'storage')
      and (coalesce(qual, '') like '%auth.uid()%' or coalesce(with_check, '') like '%auth.uid()%')
      and coalesce(qual, '') not like '%account_is_active()%'
      and coalesce(with_check, '') not like '%account_is_active()%'
  loop
    table_name := format('%I.%I', p.schemaname, p.tablename);
    guarded_using := format('(%s) and public.account_is_active()', coalesce(p.qual, 'true'));
    guarded_check := format('(%s) and public.account_is_active()', coalesce(p.with_check, p.qual, 'true'));
    if p.cmd in ('SELECT', 'DELETE') then
      execute format('alter policy %I on %s using (%s)', p.policyname, table_name, guarded_using);
    elsif p.cmd = 'INSERT' then
      execute format('alter policy %I on %s with check (%s)', p.policyname, table_name, guarded_check);
    else
      execute format('alter policy %I on %s using (%s) with check (%s)', p.policyname, table_name, guarded_using, guarded_check);
    end if;
  end loop;
end;
$$;

create or replace function public.finalize_account_deactivation(p_user_id uuid, p_token_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.account_deactivation_challenges
    where user_id = p_user_id and token_hash = p_token_hash
      and expires_at > now() and consumed_at is null for update;
  if not found then return false; end if;
  update public.profiles set deactivated_at = now()
    where id = p_user_id and deactivated_at is null;
  if not found then return false; end if;
  update public.account_deactivation_challenges set consumed_at = now() where user_id = p_user_id;
  insert into public.account_lifecycle_events(user_id, event_type) values (p_user_id, 'deactivated');
  return true;
end;
$$;
revoke all on function public.finalize_account_deactivation(uuid, text) from public, anon, authenticated;
grant execute on function public.finalize_account_deactivation(uuid, text) to service_role;

commit;

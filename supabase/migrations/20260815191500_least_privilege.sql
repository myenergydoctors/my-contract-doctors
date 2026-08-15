-- Least-privilege follow-up for the My Contract Doctors staging database.

begin;

-- PostgreSQL's row-level security does not protect TRUNCATE, and browser
-- roles never need schema-maintenance privileges.
revoke truncate, references, trigger, maintain on all tables in schema public
  from anon, authenticated;

-- Anonymous users only need the public product/vendor reference catalog.
revoke all on table
  public.agreement_analyses,
  public.api_rate_limits,
  public.invoice_analyses,
  public.invoice_extraction_jobs,
  public.invoice_line_items,
  public.notifications,
  public.profiles,
  public.subscriptions
from anon;

grant select on table public.products, public.vendors to anon;

-- Profiles are created by the auth trigger. Client users may read their row
-- and edit only the four explicitly granted profile fields.
revoke insert, delete on table public.profiles from authenticated;

-- Notification content is server-controlled. Clients may only mark their own
-- notifications read/unread.
revoke insert, delete, update on table public.notifications from authenticated;
grant update (unread) on table public.notifications to authenticated;

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own agreements" on public.agreement_analyses;
create policy "Users can update own agreements"
  on public.agreement_analyses
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own extraction jobs" on public.invoice_extraction_jobs;
create policy "Users can update own extraction jobs"
  on public.invoice_extraction_jobs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger/event-trigger helpers must not be callable through the API. Trigger
-- execution itself is unaffected by revoking direct EXECUTE privileges.
alter function public.handle_new_user() set search_path = '';
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- Safe defaults for future tables and functions created by the application
-- migration owner. Application migrations must opt browser roles into access.
-- Supabase owns separate supabase_admin defaults that project migrations are
-- not permitted to change, so every new table is also audited after creation.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

commit;

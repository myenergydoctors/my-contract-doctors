-- =============================================================
-- My Contract Doctors — Phase 2C grants fix
--
-- WHY THIS EXISTS:
-- We disabled Supabase's "Automatically expose new tables" toggle
-- for security. That keeps new tables from being auto-granted to the
-- `authenticated` role. Without GRANT, RLS policies never even get
-- evaluated — the authenticated role can't touch the table at all.
--
-- This migration explicitly grants the right privileges to the right
-- roles. Idempotent — safe to re-run.
--
-- HOW TO RUN: Supabase SQL Editor → New query → paste → Run.
-- =============================================================


-- ─── User-owned tables: full CRUD for authenticated, restricted by RLS ──

grant select, insert, delete         on table public.profiles            to authenticated;
revoke update on table public.profiles from authenticated;
grant update (first_name, last_name, business_name, industry)
  on table public.profiles to authenticated;
grant select, insert, update, delete on table public.invoice_analyses    to authenticated;
grant select, insert, update, delete on table public.agreement_analyses  to authenticated;
grant select, insert, update, delete on table public.notifications       to authenticated;
grant select, insert, update, delete on table public.invoice_line_items  to authenticated;
grant select, insert, update           on table public.invoice_extraction_jobs to authenticated;

-- Subscriptions: read-only for users (writes happen via the Stripe webhook with service_role)
grant select on table public.subscriptions to authenticated;


-- ─── Reference tables: read-only for everyone (incl. anon for public marketing pages if ever) ──

grant select on table public.products to authenticated, anon;
grant select on table public.vendors  to authenticated, anon;


-- ─── Schema-level usage ──

grant usage on schema public to authenticated, anon;


-- ─── Service role gets everything (used by webhooks, backfills, admin tasks) ──

grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;


-- ─── Add missing RLS policies on invoice_extraction_jobs ──
-- The schema-2c migration only added a SELECT policy. The extraction
-- route now writes job records using the user-session client, so we
-- need INSERT + UPDATE policies for the user's own jobs.

drop policy if exists "Users can insert own extraction jobs" on public.invoice_extraction_jobs;
drop policy if exists "Users can update own extraction jobs" on public.invoice_extraction_jobs;
create policy "Users can insert own extraction jobs"
  on public.invoice_extraction_jobs
  for insert
  with check (auth.uid() = user_id);
create policy "Users can update own extraction jobs"
  on public.invoice_extraction_jobs
  for update
  using (auth.uid() = user_id);


-- =============================================================
-- DONE. Try the invoice upload again — the 42501 error should be gone.
-- =============================================================

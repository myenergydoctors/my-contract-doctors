-- =============================================================
-- My Contract Doctors — Database Schema
-- Phase 2B
--
-- HOW TO RUN:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Click "+ New query"
-- 3. Paste this entire file
-- 4. Click "Run" (or Ctrl/Cmd + Enter)
-- 5. You should see "Success. No rows returned" at the bottom
-- 6. Reload Supabase → Table Editor — you'll see the 5 new tables
--
-- WHAT THIS DOES:
-- - Creates 5 tables: profiles, invoice_analyses, agreement_analyses,
--   notifications, subscriptions
-- - Adds a trigger that auto-creates a profile row when someone signs up
-- - Backfills profile rows for any users who signed up BEFORE this script ran
-- - Enables Row Level Security on all tables
-- - Adds RLS policies so each user can only see/modify their own data
-- - Adds indexes for the common query patterns
--
-- IT'S IDEMPOTENT: safe to re-run if anything fails partway through.
-- =============================================================


-- ─── 1. profiles ─────────────────────────────────────────────
-- 1:1 with auth.users. Holds user-facing metadata (name, business, industry)
-- and an effective plan column. Plan starts at 'free' and is updated by the
-- Stripe webhook in Phase 2D.

create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  first_name    text,
  last_name     text,
  business_name text,
  industry      text,
  plan          text not null default 'free' check (plan in ('free', 'agreement', 'pro', 'pro-annual')),
  joined_at     timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table  public.profiles is 'User-facing metadata extending auth.users. One row per signed-up user, created automatically by the on_auth_user_created trigger.';
comment on column public.profiles.plan is 'The effective subscription plan. Default ''free''. Synced from Stripe webhook on subscription change.';


-- ─── 2. Auto-create profile on signup ────────────────────────
-- When a row lands in auth.users, mirror its metadata into public.profiles.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, business_name)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'business_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop + recreate the trigger to ensure idempotency
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── 3. Backfill existing users ──────────────────────────────
-- Any users who signed up during the Phase 2A test (before this trigger
-- existed) won't have a profile row yet. Create them now.

insert into public.profiles (id, first_name, last_name, business_name)
select
  id,
  raw_user_meta_data->>'first_name',
  raw_user_meta_data->>'last_name',
  raw_user_meta_data->>'business_name'
from auth.users
on conflict (id) do nothing;


-- ─── 4. invoice_analyses ─────────────────────────────────────

create table if not exists public.invoice_analyses (
  id                              uuid primary key default gen_random_uuid(),
  user_id                         uuid not null references auth.users on delete cascade,
  uploaded_at                     timestamptz not null default now(),
  vendor                          text,
  invoice_number                  text,
  total_spend_cents               bigint,
  potential_annual_savings_cents  bigint,
  flagged_item_count              int not null default 0,
  status                          text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  top_finding                     text,
  line_items                      jsonb not null default '[]'::jsonb,
  file_path                       text,
  raw_analysis                    jsonb
);

comment on table  public.invoice_analyses is 'One row per uploaded invoice. Created when user starts an upload, updated to status=completed when Claude finishes.';
comment on column public.invoice_analyses.file_path is 'Supabase Storage path (bucket: invoices). null until Phase 2C wires real file upload.';
comment on column public.invoice_analyses.raw_analysis is 'Full JSON from /api/analyze-invoice. Kept for debugging + future re-renders.';


-- ─── 5. agreement_analyses ───────────────────────────────────

create table if not exists public.agreement_analyses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  uploaded_at     timestamptz not null default now(),
  vendor          text,
  agreement_name  text,
  risk_score      int check (risk_score >= 0 and risk_score <= 100),
  term_length     text,
  auto_renewal    text,
  top_actions     jsonb not null default '[]'::jsonb,
  clauses         jsonb not null default '[]'::jsonb,
  file_path       text,
  raw_analysis    jsonb
);

comment on table public.agreement_analyses is 'One row per uploaded contract. Same lifecycle as invoice_analyses.';


-- ─── 6. notifications ────────────────────────────────────────

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  type          text not null check (type in ('renewal', 'analysis', 'savings', 'system', 'insight')),
  title         text not null,
  body          text not null,
  href          text,
  action_label  text,
  unread        boolean not null default true,
  created_at    timestamptz not null default now()
);

comment on table public.notifications is 'Per-user notification inbox. Generated by app logic (e.g. when an invoice analysis completes, when a renewal window opens).';


-- ─── 7. subscriptions ────────────────────────────────────────
-- Synced from Stripe via webhook in Phase 2D. The plan column on profiles
-- is the read-side source of truth; this table holds the Stripe-specific
-- details (customer id, period end, etc.) for the billing page.

create table if not exists public.subscriptions (
  user_id                 uuid primary key references auth.users on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  plan                    text not null default 'free' check (plan in ('free', 'agreement', 'pro', 'pro-annual')),
  status                  text not null default 'inactive',
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  updated_at              timestamptz not null default now()
);

comment on table public.subscriptions is 'Stripe subscription state, mirrored locally for fast reads on the billing page. Updated only by the Stripe webhook with the service_role key.';


-- ─── 8. Enable RLS on every table ────────────────────────────
-- "Deny by default" — without explicit policies below, no one can read or
-- write these tables (not even the user who created the rows).

alter table public.profiles            enable row level security;
alter table public.invoice_analyses    enable row level security;
alter table public.agreement_analyses  enable row level security;
alter table public.notifications       enable row level security;
alter table public.subscriptions       enable row level security;


-- ─── 9. RLS policies ─────────────────────────────────────────
-- Each policy says "auth.uid() = owning user id". The service_role key
-- bypasses RLS entirely, so server-side admin operations (Stripe webhook,
-- backfills) work without explicit policies.

-- profiles
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- RLS controls which rows a user may update, not which columns. Keep billing
-- and authorization fields server-managed by granting column-level UPDATE
-- access only to the user-editable profile fields.
revoke update on table public.profiles from authenticated;
grant update (first_name, last_name, business_name, industry) on table public.profiles to authenticated;

-- invoice_analyses
drop policy if exists "Users can view own invoices"   on public.invoice_analyses;
drop policy if exists "Users can insert own invoices" on public.invoice_analyses;
drop policy if exists "Users can update own invoices" on public.invoice_analyses;
drop policy if exists "Users can delete own invoices" on public.invoice_analyses;
create policy "Users can view own invoices"   on public.invoice_analyses for select using (auth.uid() = user_id);
create policy "Users can insert own invoices" on public.invoice_analyses for insert with check (auth.uid() = user_id);
create policy "Users can update own invoices" on public.invoice_analyses for update using (auth.uid() = user_id);
create policy "Users can delete own invoices" on public.invoice_analyses for delete using (auth.uid() = user_id);

-- agreement_analyses
drop policy if exists "Users can view own agreements"   on public.agreement_analyses;
drop policy if exists "Users can insert own agreements" on public.agreement_analyses;
drop policy if exists "Users can update own agreements" on public.agreement_analyses;
drop policy if exists "Users can delete own agreements" on public.agreement_analyses;
create policy "Users can view own agreements"   on public.agreement_analyses for select using (auth.uid() = user_id);
create policy "Users can insert own agreements" on public.agreement_analyses for insert with check (auth.uid() = user_id);
create policy "Users can update own agreements" on public.agreement_analyses for update using (auth.uid() = user_id);
create policy "Users can delete own agreements" on public.agreement_analyses for delete using (auth.uid() = user_id);

-- notifications
drop policy if exists "Users can view own notifications"   on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can view own notifications"   on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- subscriptions — read-only for end users; writes happen via Stripe webhook
drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);


-- ─── 10. Indexes ─────────────────────────────────────────────

create index if not exists idx_invoice_analyses_user_id    on public.invoice_analyses(user_id, uploaded_at desc);
create index if not exists idx_agreement_analyses_user_id  on public.agreement_analyses(user_id, uploaded_at desc);
create index if not exists idx_notifications_user_id       on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread        on public.notifications(user_id, unread) where unread = true;


-- ─── 11. updated_at trigger for profiles + subscriptions ─────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at      on public.profiles;
drop trigger if exists set_subscriptions_updated_at on public.subscriptions;

create trigger set_profiles_updated_at      before update on public.profiles      for each row execute function public.set_updated_at();
create trigger set_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();


-- =============================================================
-- DONE. Verify in Table Editor:
-- - 5 tables under "public" schema
-- - profiles has 1+ row already (your existing test signups)
-- - RLS toggle is ON for all 5 tables (lock icon next to table name)
-- =============================================================

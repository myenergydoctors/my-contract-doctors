-- =============================================================
-- My Contract Doctors — Discount Codes
--
-- HOW TO RUN:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Paste this entire file, click "Run"
-- 3. Then manually flip your own profile to admin:
--      update public.profiles set is_admin = true where id = '<your auth.users id>';
--
-- WHAT THIS DOES:
-- - Adds is_admin to profiles (gates the /dashboard/admin/discount-codes page)
-- - Creates discount_codes: codes you (or the chat assistant) create.
--   Supports single-use one-offs (max_uses = 1) and shared multi-use codes
--   (max_uses = N or null for unlimited).
-- - Creates discount_code_redemptions: one row per redemption, used to
--   enforce "one redemption per user per code" and to give you a usage trail.
-- - No RLS policies are added for direct client access — all reads/writes
--   go through server API routes (service-role client) which check
--   is_admin themselves. RLS is enabled with no policies, so the anon/auth
--   client is locked out by default even if a route is misused.
-- =============================================================

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- The base profile RLS policy permits a user to update their own row. RLS is
-- row-scoped, so it does not by itself prevent that user from changing newly
-- added privileged columns. Restrict direct updates to safe metadata columns.
revoke update on table public.profiles from authenticated;
grant update (first_name, last_name, business_name, industry) on table public.profiles to authenticated;

comment on column public.profiles.is_admin is 'Grants access to /dashboard/admin/*. Set manually via SQL — no self-serve signup path.';


create table if not exists public.discount_codes (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  plan            text not null check (plan in ('pro', 'pro-annual', 'agreement', 'demystifier')),
  discount_pct    numeric not null check (discount_pct > 0 and discount_pct <= 1),
  max_uses        integer,                          -- null = unlimited
  times_redeemed  integer not null default 0,
  active          boolean not null default true,
  source          text not null default 'manual' check (source in ('manual', 'chat-assistant')),
  claimed_by_anon_id text,                           -- set for chat-assistant codes; ties a single-use code to the browser that claimed it
  note            text,                              -- admin-facing label, e.g. "Black Friday 2026"
  created_by      uuid references auth.users on delete set null,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.discount_codes is 'Discount codes redeemable at checkout. Validated + redeemed server-side only.';

create index if not exists discount_codes_code_idx on public.discount_codes (code);
create index if not exists discount_codes_anon_idx on public.discount_codes (claimed_by_anon_id) where claimed_by_anon_id is not null;

alter table public.discount_codes enable row level security;


create table if not exists public.discount_code_redemptions (
  id          uuid primary key default gen_random_uuid(),
  code_id     uuid not null references public.discount_codes on delete cascade,
  user_id     uuid references auth.users on delete set null,
  email       text,
  redeemed_at timestamptz not null default now()
);

comment on table public.discount_code_redemptions is 'One row per successful redemption. Used to block a user/email from redeeming the same code twice.';

create index if not exists discount_code_redemptions_code_idx on public.discount_code_redemptions (code_id);

-- Block the same signed-in user from redeeming a given code twice.
create unique index if not exists discount_code_redemptions_code_user_uq
  on public.discount_code_redemptions (code_id, user_id) where user_id is not null;

-- Block the same email from redeeming a given code twice (covers anonymous checkout).
create unique index if not exists discount_code_redemptions_code_email_uq
  on public.discount_code_redemptions (code_id, lower(email)) where email is not null;

alter table public.discount_code_redemptions enable row level security;

-- Private, identity-bound reservations. Preview checkouts never consume an offer.
create table public.annual_offer_claims (
  id uuid primary key default gen_random_uuid(),
  campaign text not null default 'annual30-v1' check (campaign = 'annual30-v1'),
  email text not null check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  user_id uuid references auth.users(id) on delete set null,
  source text not null check (source in ('timed','invoice','agreement','paywall','checkout-bump')),
  status text not null default 'reserved' check (status in ('reserved','redeemed')),
  consent_scope text not null default 'annual-offer-only' check (consent_scope = 'annual-offer-only'),
  terms_version text not null default 'annual30-first-term-v1',
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redemption_reference text unique,
  unique (campaign,email),
  unique (campaign,user_id),
  check ((status = 'reserved' and redeemed_at is null and redemption_reference is null)
    or (status = 'redeemed' and redeemed_at is not null and redemption_reference is not null))
);
create index annual_offer_claims_created on public.annual_offer_claims (created_at desc);
alter table public.annual_offer_claims enable row level security;
revoke all on public.annual_offer_claims from public,anon,authenticated;
grant select,insert,update,delete on public.annual_offer_claims to service_role;

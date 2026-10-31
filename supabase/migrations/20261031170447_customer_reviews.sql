-- Server-only review storage. No browser role can read private feedback or mutate moderation.
alter table public.profiles add column if not exists is_admin boolean not null default false;
revoke update on public.profiles from public, anon, authenticated;
grant update (first_name, last_name, business_name, industry) on public.profiles to authenticated;

create table public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  invoice_id uuid references public.invoice_analyses(id) on delete cascade,
  agreement_id uuid references public.agreement_analyses(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(btrim(body)) between 20 and 2000),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  business_name text check (business_name is null or char_length(business_name) between 1 and 120),
  role text check (role is null or char_length(role) between 1 and 80),
  publication_consent boolean not null default false,
  consent_version text not null default 'reviews-v1',
  consented_at timestamptz,
  consent_withdrawn_at timestamptz,
  status text not null default 'pending' check (status in ('pending','published','rejected','withdrawn')),
  featured boolean not null default false,
  moderation_reason text check (moderation_reason in ('spam','personal_information','abuse','unrelated','not_genuine')),
  last_actor_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(invoice_id, agreement_id) = 1),
  check (not publication_consent or consented_at is not null),
  check (status <> 'published' or publication_consent),
  check (not featured or (status = 'published' and publication_consent and rating >= 4)),
  check (status <> 'rejected' or moderation_reason is not null)
);
create index customer_reviews_public on public.customer_reviews (created_at desc) where status = 'published' and publication_consent;
create index customer_reviews_moderation on public.customer_reviews (status, created_at);
create table public.customer_review_events (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.customer_reviews(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  status text not null,
  featured boolean not null,
  publication_consent boolean not null,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.customer_reviews enable row level security;
alter table public.customer_review_events enable row level security;
revoke all on public.customer_reviews, public.customer_review_events from public, anon, authenticated;
grant select, insert, update, delete on public.customer_reviews to service_role;
grant select, insert on public.customer_review_events to service_role;

create function public.guard_customer_review() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    if not exists (select 1 from public.profiles where id = new.user_id and deactivated_at is null) then
      raise exception 'Active customer required' using errcode = '23514';
    end if;
    if new.last_actor_id <> new.user_id or new.status <> 'pending' or new.featured then
      raise exception 'Invalid initial review state' using errcode = '23514';
    end if;
    if new.invoice_id is not null and not exists (
      select 1 from public.invoice_analyses where id = new.invoice_id and user_id = new.user_id and status = 'completed'
    ) then raise exception 'Completed owned invoice required' using errcode = '23514'; end if;
    if new.agreement_id is not null and not exists (
      select 1 from public.agreement_analyses where id = new.agreement_id and user_id = new.user_id and status = 'completed'
    ) then raise exception 'Completed owned agreement required' using errcode = '23514'; end if;
  else
    if row(new.user_id,new.invoice_id,new.agreement_id,new.rating,new.body,new.display_name,new.business_name,new.role,new.consented_at,new.consent_version,new.created_at)
      is distinct from row(old.user_id,old.invoice_id,old.agreement_id,old.rating,old.body,old.display_name,old.business_name,old.role,old.consented_at,old.consent_version,old.created_at) then
      raise exception 'Review content and consent record are immutable' using errcode = '23514';
    end if;
    if new.publication_consent is distinct from old.publication_consent then
      if new.publication_consent or new.last_actor_id <> old.user_id or new.status <> 'withdrawn' or new.featured or new.consent_withdrawn_at is null then
        raise exception 'Invalid consent withdrawal' using errcode = '23514';
      end if;
    elsif not exists (select 1 from public.profiles where id = new.last_actor_id and is_admin and deactivated_at is null) then
      raise exception 'Active administrator required' using errcode = '42501';
    end if;
    if new.consent_withdrawn_at is distinct from old.consent_withdrawn_at and new.publication_consent = old.publication_consent then
      raise exception 'Consent history cannot be changed' using errcode = '23514';
    end if;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
create trigger guard_customer_review before insert or update on public.customer_reviews for each row execute function public.guard_customer_review();

create function public.audit_customer_review() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.customer_review_events (review_id,actor_id,status,featured,publication_consent,reason)
    values (new.id,new.last_actor_id,new.status,new.featured,new.publication_consent,new.moderation_reason);
  return new;
end $$;
create trigger audit_customer_review after insert or update on public.customer_reviews for each row execute function public.audit_customer_review();
revoke all on function public.guard_customer_review(), public.audit_customer_review() from public, anon, authenticated;
grant execute on function public.guard_customer_review(), public.audit_customer_review() to service_role;

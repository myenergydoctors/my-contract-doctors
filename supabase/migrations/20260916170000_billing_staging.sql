-- Provider-neutral billing foundation. Staging rows are simulations and never
-- grant an entitlement or change profiles.plan.
create table if not exists public.billing_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'staging',
  provider_customer_ref text,
  provider_subscription_ref text,
  plan text not null check (plan in ('pro','pro-annual')),
  status text not null check (status in ('trialing','active','past_due','canceled','paused')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  scheduled_plan text check (scheduled_plan in ('free','pro','pro-annual')),
  cancel_at_period_end boolean not null default false,
  cancellation_reason text,
  canceled_at timestamptz,
  updated_at timestamptz not null default now(),
  check (current_period_end > current_period_start)
);
create unique index if not exists billing_provider_subscription_ref_unique
  on public.billing_subscriptions(provider, provider_subscription_ref)
  where provider_subscription_ref is not null;

create table if not exists public.billing_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'staging',
  record_type text not null check (record_type in ('checkout_preview','plan_change','period_close','provider_invoice','provider_receipt')),
  product_code text not null,
  description text not null,
  list_price_cents integer not null check (list_price_cents >= 0),
  charged_cents integer not null default 0 check (charged_cents >= 0),
  currency text not null default 'USD',
  status text not null check (status in ('no_charge','paid','failed','refunded')),
  detail jsonb not null default '{}'::jsonb,
  check (provider <> 'staging' or (charged_cents = 0 and status = 'no_charge')),
  created_at timestamptz not null default now()
);
create index if not exists billing_records_user_created on public.billing_records(user_id, created_at desc);

create table if not exists public.billing_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null,
  resource_id uuid,
  source_provider text not null,
  source_reference text not null,
  active boolean not null default true,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (source_provider <> 'staging'),
  unique (source_provider, source_reference, product_code)
);
create index if not exists billing_entitlements_owner on public.billing_entitlements(user_id, product_code, active);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  event_key text not null,
  action text not null,
  request jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique (provider, event_key)
);
create index if not exists billing_events_user_created on public.billing_events(user_id, created_at desc);

alter table public.billing_subscriptions enable row level security;
alter table public.billing_records enable row level security;
alter table public.billing_entitlements enable row level security;
alter table public.billing_events enable row level security;
revoke all on public.billing_subscriptions, public.billing_records, public.billing_entitlements, public.billing_events from anon, authenticated;
grant select on public.billing_subscriptions, public.billing_records, public.billing_entitlements, public.billing_events to authenticated;
create policy "Read own billing subscription" on public.billing_subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "Read own billing records" on public.billing_records for select to authenticated using (auth.uid() = user_id);
create policy "Read own billing entitlements" on public.billing_entitlements for select to authenticated using (auth.uid() = user_id);
create policy "Read own billing events" on public.billing_events for select to authenticated using (auth.uid() = user_id);

-- The server calls this transaction after verifying the session. The advisory
-- lock serializes each customer's commands, and the event key makes retries safe.
create or replace function public.billing_staging_command(
  p_user_id uuid, p_action text, p_plan text, p_reason text, p_event_key uuid, p_quantity integer, p_list_price_cents integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_subscription public.billing_subscriptions%rowtype;
  v_existing public.billing_events%rowtype;
  v_now timestamptz := now();
  v_end timestamptz;
  v_price integer;
  v_result jsonb;
  v_request jsonb := jsonb_build_object('action',p_action,'plan',p_plan,'reason',p_reason,'quantity',p_quantity,'listPriceCents',p_list_price_cents);
  v_description text;
  v_record_id uuid;
  v_period_closed boolean := false;
begin
  if p_user_id is null or p_event_key is null or p_quantity is null or p_quantity < 1 or p_quantity > 100 or p_list_price_cents is null or p_list_price_cents < 0 then raise exception 'Invalid billing command'; end if;
  if p_action is null or p_action not in ('checkout','switch','schedule_free','cancel','reactivate','sync') then raise exception 'Invalid billing action'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 83));
  select * into v_existing from public.billing_events where provider = 'staging' and event_key = p_event_key::text;
  if found then
    if v_existing.user_id <> p_user_id or v_existing.request <> v_request then raise exception 'Idempotency key conflict'; end if;
    return v_existing.result;
  end if;
  select * into v_subscription from public.billing_subscriptions where user_id = p_user_id for update;
  if found and v_subscription.provider <> 'staging' and p_action <> 'sync' and not (p_action = 'checkout' and p_plan in ('agreement','demystifier','invoice-analysis','floor-mat')) then raise exception 'Live subscription cannot be changed in staging'; end if;
  if found and v_subscription.provider = 'staging' and v_subscription.status = 'active' and v_subscription.current_period_end <= v_now then
    v_period_closed := true;
    update public.billing_subscriptions set status = 'canceled', canceled_at = v_subscription.current_period_end,
      scheduled_plan = null, cancel_at_period_end = false, updated_at = v_now where user_id = p_user_id;
    insert into public.billing_records(user_id,record_type,product_code,description,list_price_cents,status)
      values(p_user_id,'period_close',v_subscription.plan,'Staging period ended; no renewal or charge occurred',0,'no_charge');
    select * into v_subscription from public.billing_subscriptions where user_id = p_user_id for update;
  end if;
  if p_action = 'checkout' then
    if p_plan is null or p_plan not in ('pro','pro-annual','agreement','demystifier','invoice-analysis','floor-mat') or (p_plan <> 'floor-mat' and p_quantity <> 1) or p_list_price_cents = 0 then raise exception 'Invalid checkout product'; end if;
    if p_plan in ('pro','pro-annual') then
      v_end := case when p_plan = 'pro' then v_now + interval '1 month' else v_now + interval '1 year' end;
      insert into public.billing_subscriptions(user_id,provider,plan,status,current_period_start,current_period_end)
        values(p_user_id,'staging',p_plan,'active',v_now,v_end)
        on conflict (user_id) do update set provider='staging', plan=excluded.plan, status='active',
          current_period_start=v_now, current_period_end=v_end, scheduled_plan=null,
          cancel_at_period_end=false, cancellation_reason=null, canceled_at=null, updated_at=v_now;
    end if;
    v_price := p_list_price_cents;
    v_description := 'No-charge staging checkout preview';
    insert into public.billing_records(user_id,record_type,product_code,description,list_price_cents,status,detail)
      values(p_user_id,'checkout_preview',p_plan,v_description,v_price * p_quantity,'no_charge',jsonb_build_object('entitlementCreated',false,'quantity',p_quantity)) returning id into v_record_id;
  elsif p_action = 'switch' then
    if v_subscription.status is distinct from 'active' or p_plan is null or p_plan not in ('pro','pro-annual') or p_plan = v_subscription.plan then raise exception 'No active plan to switch'; end if;
    v_end := case when p_plan = 'pro' then v_now + interval '1 month' else v_now + interval '1 year' end;
    update public.billing_subscriptions set plan=p_plan,current_period_start=v_now,current_period_end=v_end,
      scheduled_plan=null,cancel_at_period_end=false,cancellation_reason=null,updated_at=v_now where user_id=p_user_id;
    insert into public.billing_records(user_id,record_type,product_code,description,list_price_cents,status)
      values(p_user_id,'plan_change',p_plan,'Staging cadence switch; no charge',0,'no_charge');
  elsif p_action = 'schedule_free' then
    if v_subscription.status is distinct from 'active' then raise exception 'No active plan to downgrade'; end if;
    update public.billing_subscriptions set scheduled_plan='free',cancel_at_period_end=false,cancellation_reason=null,updated_at=v_now where user_id=p_user_id;
  elsif p_action = 'cancel' then
    if v_subscription.status is distinct from 'active' or p_reason is null or p_reason not in ('too_expensive','not_using','missing_features','other') then raise exception 'Invalid cancellation'; end if;
    update public.billing_subscriptions set cancel_at_period_end=true,scheduled_plan=null,cancellation_reason=p_reason,updated_at=v_now where user_id=p_user_id;
  elsif p_action = 'reactivate' then
    if v_subscription.status is distinct from 'active' or (not v_subscription.cancel_at_period_end and v_subscription.scheduled_plan is null) then raise exception 'Nothing scheduled to reactivate'; end if;
    update public.billing_subscriptions set cancel_at_period_end=false,scheduled_plan=null,cancellation_reason=null,updated_at=v_now where user_id=p_user_id;
  end if;
  select * into v_subscription from public.billing_subscriptions where user_id = p_user_id;
  v_result := jsonb_build_object('subscription', case when found then to_jsonb(v_subscription) else null end, 'noCharge', true, 'entitlementCreated', false, 'recordId', v_record_id);
  if p_action <> 'sync' or v_period_closed then
    insert into public.billing_events(user_id,provider,event_key,action,request,result)
      values(p_user_id,'staging',p_event_key::text,p_action,v_request,v_result);
  end if;
  return v_result;
end;
$$;
revoke all on function public.billing_staging_command(uuid,text,text,text,uuid,integer,integer) from public, anon, authenticated;
grant execute on function public.billing_staging_command(uuid,text,text,text,uuid,integer,integer) to service_role;

comment on table public.billing_subscriptions is 'Provider-neutral subscription state; staging rows never authorize paid access.';
comment on table public.billing_records is 'Billing previews, invoices, and receipts. Staging records always have charged_cents=0 and status=no_charge.';
comment on table public.billing_entitlements is 'Server-managed verified product entitlements. Staging checkout does not write here.';
comment on table public.billing_events is 'Immutable provider-neutral event and idempotency audit ledger.';

-- Entry point for a future adapter that has already verified a provider's
-- signature and translated its event. There is deliberately no public route
-- until a provider is selected and its verification is implemented.
create or replace function public.billing_apply_verified_event(
  p_provider text, p_event_key text, p_user_id uuid, p_kind text,
  p_plan text, p_status text, p_period_start timestamptz,
  p_period_end timestamptz, p_cancel_at_period_end boolean,
  p_product_code text, p_resource_id uuid, p_amount_cents integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_existing public.billing_events%rowtype;
  v_request jsonb := jsonb_build_object('kind',p_kind,'plan',p_plan,'status',p_status,
    'periodStart',p_period_start,'periodEnd',p_period_end,'cancelAtPeriodEnd',p_cancel_at_period_end,
    'productCode',p_product_code,'resourceId',p_resource_id,'amountCents',p_amount_cents);
  v_result jsonb;
begin
  if p_provider is null or p_provider = '' or p_provider = 'staging' or p_event_key is null or p_event_key = '' or p_user_id is null then
    raise exception 'Invalid provider event';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 83));
  select * into v_existing from public.billing_events where provider=p_provider and event_key=p_event_key;
  if found then
    if v_existing.user_id <> p_user_id or v_existing.request <> v_request then raise exception 'Provider event key conflict'; end if;
    return v_existing.result;
  end if;
  if p_kind = 'subscription' then
    if p_plan is null or p_plan not in ('pro','pro-annual') or p_status is null or p_status not in ('trialing','active','past_due','canceled','paused')
      or p_period_start is null or p_period_end is null or p_period_end <= p_period_start then raise exception 'Invalid subscription event'; end if;
    insert into public.billing_subscriptions(user_id,provider,plan,status,current_period_start,current_period_end,cancel_at_period_end)
      values(p_user_id,p_provider,p_plan,p_status,p_period_start,p_period_end,coalesce(p_cancel_at_period_end,false))
      on conflict (user_id) do update set provider=excluded.provider,plan=excluded.plan,status=excluded.status,
        current_period_start=excluded.current_period_start,current_period_end=excluded.current_period_end,
        cancel_at_period_end=excluded.cancel_at_period_end,scheduled_plan=null,
        canceled_at=case when excluded.status='canceled' then now() else null end,updated_at=now();
    update public.profiles set plan=case when p_status in ('trialing','active') then p_plan else 'free' end where id=p_user_id;
    v_result := jsonb_build_object('subscriptionStatus',p_status,'effectivePlan',case when p_status in ('trialing','active') then p_plan else 'free' end);
  elsif p_kind = 'one_time_purchase' then
    if p_product_code is null or p_product_code not in ('agreement','invoice-analysis','demystifier')
      or (p_product_code <> 'demystifier' and p_resource_id is null) then raise exception 'Invalid one-time purchase event'; end if;
    insert into public.billing_entitlements(user_id,product_code,resource_id,source_provider,source_reference)
      values(p_user_id,p_product_code,p_resource_id,p_provider,p_event_key);
    v_result := jsonb_build_object('entitlementGranted',true,'productCode',p_product_code,'resourceId',p_resource_id);
  elsif p_kind = 'invoice' then
    if p_product_code is null or p_amount_cents is null or p_amount_cents < 0 or p_status is null or p_status not in ('paid','failed','refunded') then
      raise exception 'Invalid invoice event'; end if;
    insert into public.billing_records(user_id,provider,record_type,product_code,description,list_price_cents,charged_cents,status)
      values(p_user_id,p_provider,'provider_invoice',p_product_code,'Provider billing invoice',p_amount_cents,
        case when p_status='paid' then p_amount_cents else 0 end,p_status);
    v_result := jsonb_build_object('invoiceRecorded',true,'status',p_status);
  else
    raise exception 'Unknown provider event';
  end if;
  insert into public.billing_events(user_id,provider,event_key,action,request,result)
    values(p_user_id,p_provider,p_event_key,p_kind,v_request,v_result);
  return v_result;
end;
$$;
revoke all on function public.billing_apply_verified_event(text,text,uuid,text,text,text,timestamptz,timestamptz,boolean,text,uuid,integer) from public, anon, authenticated;
grant execute on function public.billing_apply_verified_event(text,text,uuid,text,text,text,timestamptz,timestamptz,boolean,text,uuid,integer) to service_role;

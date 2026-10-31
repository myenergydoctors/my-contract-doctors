create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  analysis_email boolean not null default false,
  renewal_email boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.agreement_reminder_settings (
  agreement_id uuid primary key references public.agreement_analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notice_deadline date not null,
  enabled boolean not null default true,
  generation uuid not null default gen_random_uuid(),
  confirmed_at timestamptz not null default now()
);
create table public.notification_email_jobs (
  id uuid primary key references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('analysis','renewal')),
  context jsonb not null default '{}',
  status text not null check (status in ('pending','sending','sent','suppressed','failed','uncertain')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  next_attempt_at timestamptz not null default now(),
  claim_token uuid,
  claimed_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now()
);
create index notification_email_jobs_pending on public.notification_email_jobs(next_attempt_at) where status='pending';
create index notification_email_jobs_owner on public.notification_email_jobs(user_id,created_at desc);
create index agreement_reminder_settings_owner on public.agreement_reminder_settings(user_id);
alter table public.notification_preferences enable row level security;
alter table public.agreement_reminder_settings enable row level security;
alter table public.notification_email_jobs enable row level security;
revoke all on public.notification_preferences, public.agreement_reminder_settings, public.notification_email_jobs from anon, authenticated;
grant select on public.notification_preferences, public.agreement_reminder_settings to authenticated;
grant select,insert,update,delete on public.notification_preferences, public.agreement_reminder_settings, public.notification_email_jobs to service_role;
create policy notification_preferences_owner on public.notification_preferences for select to authenticated using (user_id=(select auth.uid()) and public.account_is_active());
create policy agreement_reminder_settings_owner on public.agreement_reminder_settings for select to authenticated using (user_id=(select auth.uid()) and public.account_is_active());

-- Server-only transactional event + delivery intent. No browser can queue mail.
create function public.record_notification_event(p_event jsonb,p_category text,p_context jsonb default '{}') returns void
language plpgsql security invoker set search_path='' as $$
declare v_user uuid := (p_event->>'user_id')::uuid; v_id uuid := (p_event->>'id')::uuid; v_opted boolean;
begin
  if p_category not in ('analysis','renewal') then raise exception 'Invalid notification category'; end if;
  insert into public.notifications(id,user_id,type,title,body,href,action_label,unread)
  values(v_id,v_user,p_event->>'type',p_event->>'title',p_event->>'body',p_event->>'href',p_event->>'action_label',true)
  on conflict(id) do nothing;
  if not exists(select 1 from public.notifications where id=v_id and user_id=v_user) then raise exception 'Notification owner mismatch'; end if;
  select case when p_category='analysis' then analysis_email else renewal_email end into v_opted
  from public.notification_preferences where user_id=v_user;
  insert into public.notification_email_jobs(id,user_id,category,context,status)
  values(v_id,v_user,p_category,p_context,case when coalesce(v_opted,false) then 'pending' else 'suppressed' end)
  on conflict(id) do nothing;
end $$;
revoke all on function public.record_notification_event(jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_notification_event(jsonb,text,jsonb) to service_role;

create function public.claim_notification_email_jobs(p_user_id uuid default null,p_limit integer default 20)
returns setof public.notification_email_jobs language plpgsql security invoker set search_path='' as $$
begin
  -- An interrupted send has an unknown provider outcome; never blindly resend it.
  update public.notification_email_jobs set status='uncertain',last_error='Send interrupted; provider acceptance needs review'
  where status='sending' and claimed_at<now()-interval '10 minutes' and (p_user_id is null or user_id=p_user_id);
  return query
  with candidates as (
    select id from public.notification_email_jobs where status='pending' and next_attempt_at<=now() and attempts<5
    and (p_user_id is null or user_id=p_user_id) order by next_attempt_at,id
    for update skip locked limit greatest(0,least(p_limit,50))
  ) update public.notification_email_jobs j set status='sending',attempts=j.attempts+1,claimed_at=now(),claim_token=gen_random_uuid()
    from candidates c where j.id=c.id returning j.*;
end $$;
revoke all on function public.claim_notification_email_jobs(uuid,integer) from public,anon,authenticated;
grant execute on function public.claim_notification_email_jobs(uuid,integer) to service_role;

create table public.notification_delivery_actions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.notification_email_jobs(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  outcome text not null check (outcome in ('confirmed_sent','confirmed_not_sent')),
  note text not null check (length(note) between 5 and 500),
  created_at timestamptz not null default now()
);
alter table public.notification_delivery_actions enable row level security;
revoke all on public.notification_delivery_actions from anon,authenticated;
grant select,insert,delete on public.notification_delivery_actions to service_role;
create function public.resolve_notification_email_job(p_id uuid,p_actor uuid,p_outcome text,p_note text) returns boolean
language plpgsql security invoker set search_path='' as $$
declare v_status text;
begin
  if not exists(select 1 from public.profiles where id=p_actor and is_admin=true and deactivated_at is null) then raise exception 'Administrator required'; end if;
  if p_outcome not in ('confirmed_sent','confirmed_not_sent') or length(trim(p_note)) not between 5 and 500 then raise exception 'Provider verification required'; end if;
  select status into v_status from public.notification_email_jobs where id=p_id for update;
  if v_status is null or v_status not in ('failed','uncertain') then return false; end if;
  insert into public.notification_delivery_actions(job_id,actor_id,outcome,note) values(p_id,p_actor,p_outcome,trim(p_note));
  update public.notification_email_jobs set
    status=case when p_outcome='confirmed_sent' then 'sent' else 'pending' end,
    sent_at=case when p_outcome='confirmed_sent' then now() else null end,
    attempts=case when p_outcome='confirmed_not_sent' then 0 else attempts end,
    next_attempt_at=now(),claim_token=null,claimed_at=null,last_error='Provider outcome verified by administrator'
  where id=p_id;
  return true;
end $$;
revoke all on function public.resolve_notification_email_job(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.resolve_notification_email_job(uuid,uuid,text,text) to service_role;

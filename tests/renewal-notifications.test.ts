import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server.js";
import { loadRoute } from "./helpers/load-route.mjs";
// @ts-expect-error Node's type-stripping runner uses explicit TypeScript extensions.
import { dueReminder, validDate, unsubscribeToken, readUnsubscribeToken, deliveryFailure } from "../lib/notifications/domain.ts";

test("reminders use real calendar dates, the notice cutoff, and only the current milestone", () => {
  assert.equal(validDate("2027-02-29"), false); assert.equal(validDate("2028-02-29"), true);
  const now = new Date("2026-10-31T13:00:00Z");
  assert.deepEqual(dueReminder("2026-11-03", now), { lead: 7, days: 3 });
  assert.deepEqual(dueReminder("2026-11-30", now), { lead: 30, days: 30 });
  assert.deepEqual(dueReminder("2026-10-31", now), { lead: 0, days: 0 });
  assert.equal(dueReminder("2026-10-30", now), null); assert.equal(dueReminder("2027-10-31", now), null);
});
test("unsubscribe proof is category-bound and retries distinguish unknown delivery outcomes", () => {
  const user = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", token = unsubscribeToken(user, "renewal", "secret");
  assert.deepEqual(readUnsubscribeToken(token, "secret"), { userId: user, category: "renewal" });
  assert.equal(readUnsubscribeToken(token.replace("renewal", "analysis"), "secret"), null);
  assert.equal(readUnsubscribeToken(token, "different"), null);
  assert.equal(deliveryFailure(429, 1).status, "pending"); assert.equal(deliveryFailure(503, 5).status, "failed");
  assert.equal(deliveryFailure(400, 1).status, "failed"); assert.equal(deliveryFailure(undefined, 1).status, "uncertain");
});
test("cron routes fail closed without the exact secret and call only their intended worker", async () => {
  const original = process.env.CRON_SECRET; let scheduled = 0, delivered = 0;
  const stubs = { "@/lib/notifications/server": { scheduleRenewalReminders: async () => { scheduled++; return { due: 0 }; }, deliverNotificationEmails: async () => { delivered++; return { configured: true, sent: 0 }; } } };
  const renewal = loadRoute("app/api/cron/renewal-reminders/route.ts", stubs);
  const email = loadRoute("app/api/cron/notification-emails/route.ts", stubs);
  const request = (authorization?: string) => new NextRequest("https://example.test/api/cron/renewal-reminders", { headers: authorization ? { authorization } : {} });
  try {
    delete process.env.CRON_SECRET;
    assert.equal((await renewal.GET(request())).status, 401);
    process.env.CRON_SECRET = "isolated-test-only";
    assert.equal((await email.GET(request("Bearer wrong"))).status, 401);
    assert.equal(scheduled + delivered, 0);
    assert.equal((await renewal.GET(request("Bearer isolated-test-only"))).status, 200);
    assert.equal((await email.GET(request("Bearer isolated-test-only"))).status, 200);
    assert.equal(scheduled, 1); assert.equal(delivered, 1);
  } finally { if (original === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = original; }
});
test("PostgreSQL stores event and delivery intent together, locks claims, and restricts queue control to the server", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
      create table public.profiles(id uuid primary key,plan text,is_admin boolean,deactivated_at timestamptz);
      create function public.account_is_active() returns boolean language sql as $$ select exists(select 1 from public.profiles where id=auth.uid() and deactivated_at is null) $$;
      create table public.agreement_analyses(id uuid primary key);
      create table public.notifications(id uuid primary key,user_id uuid,type text,title text,body text,href text,action_label text,unread boolean);
      grant usage on schema public,auth to anon,authenticated,service_role;
      grant select on public.profiles to authenticated;
      grant all on public.notifications,public.profiles,auth.users to service_role;
      insert into auth.users values ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb');
      insert into public.profiles values ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','pro',false,null),('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb','pro',true,null);`);
    await db.exec(await readFile(new URL('../supabase/migrations/20261031211458_renewal_notification_delivery.sql', import.meta.url), 'utf8'));
    const event = { id: "cccccccc-cccc-4ccc-accc-cccccccccccc", user_id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", type: "analysis", title: "Ready", body: "Saved", href: "/dashboard", action_label: "Open" };
    await db.exec('set role service_role');
    await db.query('select public.record_notification_event($1::jsonb,$2,$3::jsonb)', [JSON.stringify(event), 'analysis', '{}']);
    assert.equal((await db.query<{ status: string }>('select status from public.notification_email_jobs')).rows[0].status, 'suppressed');
    await db.exec(`insert into public.notification_preferences(user_id,analysis_email,renewal_email) values ('${event.user_id}',true,true)`);
    event.id = "dddddddd-dddd-4ddd-addd-dddddddddddd";
    await db.query('select public.record_notification_event($1::jsonb,$2)', [JSON.stringify(event), 'analysis']);
    await db.query('select public.record_notification_event($1::jsonb,$2)', [JSON.stringify(event), 'analysis']);
    assert.equal((await db.query('select * from public.notifications')).rows.length, 2);
    assert.equal((await db.query('select * from public.claim_notification_email_jobs(null,20)')).rows.length, 1);
    assert.equal((await db.query('select * from public.claim_notification_email_jobs(null,20)')).rows.length, 0);
    await db.exec("update public.notification_email_jobs set claimed_at=now()-interval '11 minutes' where status='sending'");
    assert.equal((await db.query('select * from public.claim_notification_email_jobs(null,20)')).rows.length, 0);
    assert.equal((await db.query<{ status: string }>("select status from public.notification_email_jobs where id=$1", [event.id])).rows[0].status, 'uncertain');
    await assert.rejects(db.query("select public.resolve_notification_email_job($1,$2,'confirmed_not_sent','Provider verified')", [event.id,event.user_id]));
    assert.equal((await db.query<{ resolved: boolean }>("select public.resolve_notification_email_job($1,$2,'confirmed_not_sent','Provider verified') as resolved", [event.id,'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb'])).rows[0].resolved, true);
    assert.equal((await db.query('select * from public.notification_delivery_actions')).rows.length, 1);
    await db.exec(`reset role; set role authenticated; set test.uid='${event.user_id}'`);
    assert.equal((await db.query('select * from public.notification_preferences')).rows.length, 1);
    await assert.rejects(db.query('select * from public.notification_email_jobs'), (e: { code?: string }) => e.code === '42501');
    await assert.rejects(db.query('select * from public.claim_notification_email_jobs(null,20)'), (e: { code?: string }) => e.code === '42501');
    await assert.rejects(db.query('select public.record_notification_event($1::jsonb,$2)', [JSON.stringify(event), 'analysis']), (e: { code?: string }) => e.code === '42501');
    await assert.rejects(db.query(`update public.notification_preferences set analysis_email=true`), (e: { code?: string }) => e.code === '42501');
    await db.exec("set test.uid='bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb'");
    assert.equal((await db.query('select * from public.notification_preferences')).rows.length, 0);
  } finally { await db.close(); }
});

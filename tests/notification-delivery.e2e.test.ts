import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server.js";
import { loadRoute } from "./helpers/load-route.mjs";
import { removeDisposableAccount } from "../scripts/lib/qa-cleanup.mjs";
// @ts-expect-error Node's test runner requires TypeScript extensions.
import { unsubscribeToken } from "../lib/notifications/domain.ts";
const enabled = process.env.DELIVERY_E2E === "true" && process.env.DELIVERY_E2E_PROJECT === "xrchncayomnwcnphrwhx" && process.env.NEXT_PUBLIC_SUPABASE_URL === "https://xrchncayomnwcnphrwhx.supabase.co";

test("real delivery queue handles retries, uncertainty, consent, schedule changes and concurrent workers", { skip: !enabled }, async () => {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const original = { enabled: process.env.NOTIFICATION_EMAILS_ENABLED, sendgrid: process.env.SENDGRID_API_KEY, signing: process.env.NOTIFICATION_SIGNING_SECRET };
  const user = await admin.auth.admin.createUser({ email: `account-flow-${randomUUID()}@example.invalid`, password: randomUUID(), email_confirm: true });
  assert.ifError(user.error); const userId = user.data.user!.id;
  const check = (result: { error: unknown }) => assert.ifError(result.error);
  process.env.NOTIFICATION_EMAILS_ENABLED = "true"; process.env.SENDGRID_API_KEY = "test-only"; process.env.NOTIFICATION_SIGNING_SECRET = "test-only-signature";
  const { scheduleRenewalReminders, deliverNotificationEmails, recordEvent } = loadRoute("lib/notifications/server.ts", {
    "@/lib/supabase/admin": { createAdminClient: () => admin }, "@sendgrid/mail": { setApiKey: () => {}, send: () => { throw new Error("Real email transport prohibited in this test"); } },
  });
  let calls = 0;
  const sentIds = new Set<string>();
  const send = async (mail: { customArgs: { notification_id: string }; from: { email: string }; to: string }) => {
    calls++; assert.equal(mail.to, user.data.user!.email); assert.equal(mail.from.email, "help@mycontractdoctors.com");
    assert.equal(sentIds.has(mail.customArgs.notification_id), false); sentIds.add(mail.customArgs.notification_id);
    return [{ headers: { "x-message-id": "synthetic-accepted" } }];
  };
  try {
    check(await admin.from("profiles").update({ plan: "pro" }).eq("id", userId));
    const agreement = await admin.from("agreement_analyses").insert({ user_id: userId, agreement_name: "Synthetic renewal QA", status: "completed", review_status: "confirmed" }).select("id").single();
    check(agreement); const agreementId = agreement.data!.id;
    const now = new Date(); const deadline = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10);
    const configure = async (email = true) => {
      check(await admin.from("notification_preferences").upsert({ user_id: userId, analysis_email: true, renewal_email: email }));
      check(await admin.from("agreement_reminder_settings").upsert({ agreement_id: agreementId, user_id: userId, notice_deadline: deadline, generation: randomUUID(), enabled: true }));
      await scheduleRenewalReminders(userId, now, admin);
    };
    await configure(); await scheduleRenewalReminders(userId, now, admin);
    assert.equal((await deliverNotificationEmails(userId, admin, send)).sent, 1);
    assert.equal((await deliverNotificationEmails(userId, admin, send)).sent, 0); assert.equal(calls, 1);

    await configure();
    const temporary = await deliverNotificationEmails(userId, admin, async () => { throw { code: 429 }; });
    assert.equal(temporary.retrying, 1);
    check(await admin.from("notification_email_jobs").update({ next_attempt_at: new Date(Date.now() - 1000).toISOString() }).eq("user_id", userId).eq("status", "pending"));
    assert.equal((await deliverNotificationEmails(userId, admin, send)).sent, 1);

    await configure();
    assert.equal((await deliverNotificationEmails(userId, admin, async () => { throw new Error("Network outcome unknown"); })).uncertain, 1);
    assert.equal((await deliverNotificationEmails(userId, admin, send)).sent, 0);
    const uncertain = await admin.from("notification_email_jobs").select("id").eq("user_id", userId).eq("status", "uncertain").single(); check(uncertain);
    const forbidden = await admin.rpc("resolve_notification_email_job", { p_id: uncertain.data!.id, p_actor: userId, p_outcome: "confirmed_not_sent", p_note: "Synthetic provider verification" }); assert.ok(forbidden.error);
    check(await admin.from("profiles").update({ is_admin: true }).eq("id", userId));
    check(await admin.rpc("resolve_notification_email_job", { p_id: uncertain.data!.id, p_actor: userId, p_outcome: "confirmed_not_sent", p_note: "Synthetic provider verification" }));
    assert.equal((await deliverNotificationEmails(userId, admin, send)).sent, 1);

    await configure(false); assert.equal((await deliverNotificationEmails(userId, admin, send)).sent, 0);
    await configure(); check(await admin.from("agreement_reminder_settings").update({ enabled: false }).eq("agreement_id", agreementId));
    assert.equal((await deliverNotificationEmails(userId, admin, send)).suppressed, 1);
    await configure(); check(await admin.from("profiles").update({ plan: "free" }).eq("id", userId));
    assert.equal((await deliverNotificationEmails(userId, admin, send)).suppressed, 1);
    check(await admin.from("profiles").update({ plan: "pro" }).eq("id", userId));

    const { POST } = loadRoute("app/api/notifications/unsubscribe/route.ts", { "@/lib/supabase/admin": { createAdminClient: () => admin } });
    const token = unsubscribeToken(userId, "renewal", "test-only-signature");
    assert.equal((await POST(new NextRequest(`https://example.test/api/notifications/unsubscribe?token=${token}`, { method: "POST", body: "List-Unsubscribe=One-Click" }))).status, 200);
    const preference = await admin.from("notification_preferences").select("analysis_email,renewal_email").eq("user_id", userId).single(); check(preference);
    assert.equal(preference.data!.analysis_email, true); assert.equal(preference.data!.renewal_email, false);

    for (let i = 0; i < 4; i++) await recordEvent({ id: randomUUID(), user_id: userId, type: "analysis", title: "Synthetic QA event", body: "Synthetic concurrent worker test", href: "/dashboard/notifications", action_label: "Open" }, "analysis", {}, admin);
    const concurrent = await Promise.all([deliverNotificationEmails(userId, admin, send), deliverNotificationEmails(userId, admin, send)]);
    assert.equal(concurrent.reduce((total, item) => total + item.sent, 0), 4);

    await configure();
    for (let attempt = 1; attempt <= 5; attempt++) {
      const result = await deliverNotificationEmails(userId, admin, async () => { throw { code: 503 }; });
      assert.equal(attempt < 5 ? result.retrying : result.failed, 1);
      check(await admin.from("notification_email_jobs").update({ next_attempt_at: new Date(Date.now() - 1000).toISOString() }).eq("user_id", userId).eq("status", "pending"));
    }
    assert.equal((await deliverNotificationEmails(userId, admin, send)).sent, 0);
    await configure(); check(await admin.from("profiles").update({ deactivated_at: new Date().toISOString() }).eq("id", userId));
    assert.equal((await deliverNotificationEmails(userId, admin, send)).suppressed, 1);
    check(await admin.from("profiles").update({ deactivated_at: null, is_admin: false }).eq("id", userId));
    const authStub = { auth: { getUser: async () => ({ data: { user: { id: userId, email_confirmed_at: "2026-01-01" } } }) }, rpc: async () => ({ data: true, error: null }) };
    const routes = loadRoute("app/api/account/reminders/route.ts", { "@/lib/supabase/admin": { createAdminClient: () => admin }, "@/lib/supabase/server": { createClient: async () => authStub } });
    const request = (body: object, origin = "https://example.test") => new NextRequest("https://example.test/api/account/reminders", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
    const input = { agreementId, noticeDeadline: deadline, enabled: true };
    assert.equal((await routes.POST(request(input, "https://attacker.test"))).status, 403);
    assert.equal((await routes.POST(request({ ...input, agreementId: randomUUID() }))).status, 404);
    check(await admin.from("profiles").update({ plan: "free" }).eq("id", userId));
    assert.equal((await routes.POST(request(input))).status, 403);
    assert.equal((await routes.POST(request({ ...input, enabled: false }))).status, 200);
    check(await admin.from("profiles").update({ plan: "pro" }).eq("id", userId));
    check(await admin.from("agreement_analyses").update({ review_status: "needs_review" }).eq("id", agreementId));
    assert.equal((await routes.POST(request(input))).status, 403);
    check(await admin.from("agreement_analyses").update({ review_status: "confirmed" }).eq("id", agreementId));
    assert.equal((await routes.POST(request(input))).status, 200);
    const before = await admin.from("agreement_reminder_settings").select("generation").eq("agreement_id", agreementId).single(); check(before);
    assert.equal((await routes.POST(request(input))).status, 200);
    const after = await admin.from("agreement_reminder_settings").select("generation").eq("agreement_id", agreementId).single(); check(after);
    assert.equal(before.data!.generation, after.data!.generation);
  } finally {
    for (const [key, value] of Object.entries({ NOTIFICATION_EMAILS_ENABLED: original.enabled, SENDGRID_API_KEY: original.sendgrid, NOTIFICATION_SIGNING_SECRET: original.signing })) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    assert.ifError((await removeDisposableAccount(admin, userId)).error);
  }
});

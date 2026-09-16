import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const projectRef = process.env.BILLING_E2E_PROJECT_REF;
const configuredHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : "";
const enabled = process.env.BILLING_E2E === "true" && Boolean(projectRef && configuredHost === `${projectRef}.supabase.co` && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

test("staging lifecycle, idempotency, ownership, and verified-event boundary", { skip: !enabled }, async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const email = `billing-e2e-${crypto.randomUUID()}@example.invalid`;
  const password = crypto.randomUUID();
  const created = await admin.auth.admin.createUser({ email, email_confirm: true, password });
  assert.ifError(created.error);
  const userId = created.data.user!.id;
  let otherUserId: string | undefined;
  const command = async (action: string, plan: string | null = null, reason: string | null = null, key = crypto.randomUUID()) => {
    const response = await admin.rpc("billing_staging_command", {
      p_user_id: userId, p_action: action, p_plan: plan, p_reason: reason, p_event_key: key, p_quantity: 1, p_list_price_cents: action === "checkout" ? 2900 : 0,
    });
    assert.ifError(response.error);
    return response.data as { subscription: { plan: string; status: string; scheduled_plan: string | null; cancel_at_period_end: boolean }; recordId: string | null; entitlementCreated: boolean };
  };
  try {
    const key = crypto.randomUUID();
    const first = await command("checkout", "pro", null, key);
    assert.equal(first.subscription.plan, "pro");
    assert.equal(first.entitlementCreated, false);
    assert.ok(first.recordId);
    const replay = await command("checkout", "pro", null, key);
    assert.deepEqual(replay, first);
    const { data: checkoutRows, error: checkoutCountError } = await admin.from("billing_records").select("id").eq("user_id", userId).eq("record_type", "checkout_preview");
    assert.equal(checkoutCountError, null, JSON.stringify(checkoutCountError));
    assert.equal(checkoutRows?.length, 1);
    const owner = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    assert.ifError((await owner.auth.signInWithPassword({ email, password })).error);
    const ownerRead = await owner.from("billing_records").select("id").eq("user_id", userId);
    assert.ifError(ownerRead.error);
    assert.equal(ownerRead.data?.length, 1);
    const otherEmail = `billing-e2e-${crypto.randomUUID()}@example.invalid`;
    const otherPassword = crypto.randomUUID();
    const otherCreated = await admin.auth.admin.createUser({ email: otherEmail, email_confirm: true, password: otherPassword });
    assert.ifError(otherCreated.error);
    otherUserId = otherCreated.data.user!.id;
    const other = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    assert.ifError((await other.auth.signInWithPassword({ email: otherEmail, password: otherPassword })).error);
    const otherRead = await other.from("billing_records").select("id").eq("user_id", userId);
    assert.ifError(otherRead.error);
    assert.equal(otherRead.data?.length, 0);
    const switchResult = await command("switch", "pro-annual");
    assert.equal(switchResult.subscription.plan, "pro-annual");
    const downgrade = await command("schedule_free");
    assert.equal(downgrade.subscription.scheduled_plan, "free");
    const reactivated = await command("reactivate");
    assert.equal(reactivated.subscription.scheduled_plan, null);
    const canceled = await command("cancel", null, "not_using");
    assert.equal(canceled.subscription.cancel_at_period_end, true);
    assert.equal((await command("reactivate")).subscription.cancel_at_period_end, false);
    const oneTime = await command("checkout", "demystifier");
    assert.ok(oneTime.recordId);
    const { count: entitlements } = await admin.from("billing_entitlements").select("*", { count: "exact", head: true }).eq("user_id", userId);
    assert.equal(entitlements, 0);
    const { data: profile } = await admin.from("profiles").select("plan").eq("id", userId).single();
    assert.equal(profile?.plan, "free");
    const { data: hidden, error: anonymousReadError } = await anon.from("billing_records").select("id").eq("user_id", userId);
    assert.equal(hidden, null);
    assert.equal(anonymousReadError?.code, "42501");
    const oldStart = new Date(Date.now() - 60 * 86400000).toISOString();
    const oldEnd = new Date(Date.now() - 30 * 86400000).toISOString();
    assert.ifError((await admin.from("billing_subscriptions").update({ current_period_start: oldStart, current_period_end: oldEnd }).eq("user_id", userId)).error);
    assert.equal((await command("sync")).subscription.status, "canceled");
    const providerKey = crypto.randomUUID();
    const providerStart = new Date().toISOString();
    const providerEnd = new Date(Date.now() + 30 * 86400000).toISOString();
    const event = async (kind: string, status: string | null, plan: string | null, key: string) => admin.rpc("billing_apply_verified_event", {
      p_provider: "e2e-adapter", p_event_key: key, p_user_id: userId, p_kind: kind, p_plan: plan, p_status: status,
      p_period_start: providerStart, p_period_end: providerEnd,
      p_cancel_at_period_end: false, p_product_code: null, p_resource_id: null, p_amount_cents: null,
    });
    assert.ifError((await event("subscription", "active", "pro", providerKey)).error);
    assert.ifError((await event("subscription", "active", "pro", providerKey)).error);
    assert.equal((await admin.from("profiles").select("plan").eq("id", userId).single()).data?.plan, "pro");
    assert.equal((await command("sync")).subscription.status, "active");
    assert.ok((await command("checkout", "demystifier")).recordId);
    const blocked = await admin.rpc("billing_staging_command", { p_user_id: userId, p_action: "switch", p_plan: "pro-annual", p_reason: null, p_event_key: crypto.randomUUID(), p_quantity: 1, p_list_price_cents: 0 });
    assert.ok(blocked.error);
    assert.ifError((await event("subscription", "canceled", "pro", crypto.randomUUID())).error);
    assert.equal((await admin.from("profiles").select("plan").eq("id", userId).single()).data?.plan, "free");
  } finally {
    const otherDeleted = otherUserId ? await admin.auth.admin.deleteUser(otherUserId) : null;
    const deleted = await admin.auth.admin.deleteUser(userId);
    if (otherDeleted) assert.ifError(otherDeleted.error);
    assert.ifError(deleted.error);
  }
});

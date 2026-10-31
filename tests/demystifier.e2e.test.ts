import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadRoute } from "./helpers/load-route.mjs";
import { removeDisposableAccount } from "../scripts/lib/qa-cleanup.mjs";
const enabled = process.env.DEMYSTIFIER_E2E === "true" && process.env.DEMYSTIFIER_E2E_PROJECT === "xrchncayomnwcnphrwhx" && process.env.NEXT_PUBLIC_SUPABASE_URL === "https://xrchncayomnwcnphrwhx.supabase.co";
test("real Demystifier checkout stays locked; verified fixture restores across sessions, isolates owners and revokes", { skip: !enabled }, async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const ids: string[] = [];
  async function account() {
    const email = `account-flow-${randomUUID()}@example.invalid`, password = randomUUID();
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true }); assert.ifError(created.error); ids.push(created.data.user!.id);
    const client = createClient(url, key, { auth: { persistSession: false } }); assert.ifError((await client.auth.signInWithPassword({ email, password })).error);
    return { id: created.data.user!.id, email, password, client };
  }
  const snapshot = async (client: SupabaseClient) => {
    const route = loadRoute("app/api/demystifier/route.ts", { "@/lib/supabase/server": { createClient: async () => client }, "@/lib/supabase/admin": { createAdminClient: () => admin } });
    const response = await route.GET(); assert.equal(response.status, 200); return response.json();
  };
  try {
    const owner = await account(), other = await account();
    assert.equal((await snapshot(owner.client)).access, false);
    const checkout = await admin.rpc("billing_staging_command", { p_user_id: owner.id, p_action: "checkout", p_reason: null, p_plan: "demystifier", p_event_key: randomUUID(), p_quantity: 1, p_list_price_cents: 4999 }); assert.ifError(checkout.error);
    assert.equal(checkout.data.entitlementCreated, false); assert.equal(checkout.data.noCharge, true);
    assert.equal((await snapshot(owner.client)).clauses.length, 1);
    const record = await admin.from("billing_records").select("charged_cents").eq("id", checkout.data.recordId).single(); assert.ifError(record.error); assert.equal(record.data!.charged_cents, 0);
    const eventKey = randomUUID();
    const event = { p_provider: "synthetic-demystifier-qa", p_event_key: eventKey, p_user_id: owner.id, p_kind: "one_time_purchase", p_product_code: "demystifier", p_status: "paid", p_amount_cents: 0, p_plan: null, p_period_start: null, p_period_end: null, p_cancel_at_period_end: false, p_resource_id: null };
    assert.ifError((await admin.rpc("billing_apply_verified_event", event)).error); assert.ifError((await admin.rpc("billing_apply_verified_event", event)).error);
    assert.equal((await snapshot(owner.client)).clauses.length, 7);
    assert.equal((await snapshot(other.client)).clauses.length, 1);
    assert.equal((await other.client.from("billing_entitlements").select("id").eq("user_id", owner.id)).data?.length, 0);
    assert.ok((await owner.client.from("billing_entitlements").insert({ user_id: other.id, product_code: "demystifier", source_provider: "spoofed", source_reference: randomUUID() })).error);
    assert.ok((await owner.client.rpc("billing_apply_verified_event", { ...event, p_event_key: randomUUID() })).error);
    assert.ifError((await other.client.auth.updateUser({ data: { demystifier: true, plan: "pro", is_admin: true } })).error);
    assert.equal((await snapshot(other.client)).access, false);
    await owner.client.auth.signOut(); const fresh = createClient(url, key, { auth: { persistSession: false } }); assert.ifError((await fresh.auth.signInWithPassword({ email: owner.email, password: owner.password })).error);
    assert.equal((await snapshot(fresh)).access, true);
    const entitlement = await admin.from("billing_entitlements").select("id").eq("user_id", owner.id).eq("source_reference", eventKey).single(); assert.ifError(entitlement.error);
    assert.ifError((await admin.from("billing_entitlements").update({ revoked_at: new Date().toISOString() }).eq("id", entitlement.data!.id)).error);
    assert.equal((await snapshot(fresh)).access, false);
    assert.ifError((await admin.from("billing_entitlements").update({ revoked_at: null, active: false }).eq("id", entitlement.data!.id)).error);
    assert.equal((await snapshot(fresh)).clauses.length, 1);
    assert.ifError((await admin.from("billing_entitlements").update({ active: true }).eq("id", entitlement.data!.id)).error);
    assert.ifError((await admin.from("profiles").update({ deactivated_at: new Date().toISOString() }).eq("id", owner.id)).error);
    assert.equal((await snapshot(fresh)).access, false);
  } finally { for (const id of ids) assert.ifError((await removeDisposableAccount(admin, id)).error); }
});

import assert from "node:assert/strict";
import test from "node:test";
import { loadRoute } from "./helpers/load-route.mjs";
function route(user: object | null, options: { entitled?: boolean; deactivated?: boolean; failure?: boolean } = {}) {
  const filters: [string, string, unknown][] = [];
  let table = "";
  const query = {
    select() { return this; },
    eq(column: string, value: unknown) { filters.push([table, column, value]); return this; },
    is(column: string, value: unknown) { filters.push([table, column, value]); return this; },
    neq(column: string, value: unknown) { filters.push([table, column, value]); return this; },
    async maybeSingle() { return { data: { deactivated_at: options.deactivated ? "2026-10-31" : null }, error: options.failure ? new Error("private database detail") : null }; },
    async limit() { return { data: options.entitled ? [{ id: "test-entitlement" }] : [], error: null }; },
  };
  const result = loadRoute("app/api/demystifier/route.ts", {
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user }, error: null }) } }) },
    "@/lib/supabase/admin": { createAdminClient: () => ({ from(name: string) { table = name; return query; } }) },
  });
  return { ...result, filters };
}
test("Demystifier never serializes locked content for visitors or accounts without an entitlement", async () => {
  for (const user of [null, { id: "owner", email_confirmed_at: "now", user_metadata: { plan: "pro", demystifier: true } }]) {
    const response = await route(user).GET(); const data = await response.json();
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(data.access, false); assert.equal(data.clauses.length, 1); assert.equal(data.checklist.length, 0);
    assert.equal(JSON.stringify(data).includes("Subject: Confirming renewal"), false);
  }
});
test("restore uses only the current verified owner and exact active global Demystifier entitlement", async () => {
  const access = route({ id: "verified-owner", email_confirmed_at: "now" }, { entitled: true });
  const data = await (await access.GET()).json(); assert.equal(data.access, true); assert.equal(data.clauses.length, 7); assert.equal(data.checklist.length, 7);
  for (const filter of [["user_id", "verified-owner"], ["product_code", "demystifier"], ["active", true], ["revoked_at", null], ["resource_id", null], ["source_provider", "staging"]]) assert.ok(access.filters.some(row => row[0] === "billing_entitlements" && row[1] === filter[0] && row[2] === filter[1]));
  assert.equal((await (await route({ id: "owner", email_confirmed_at: "now" }, { entitled: true, deactivated: true }).GET()).json()).access, false);
  assert.equal((await (await route({ id: "owner" }, { entitled: true }).GET()).json()).access, false);
});
test("database failures return a retryable private response without stale or paid content", async () => {
  const response = await route({ id: "owner", email_confirmed_at: "now" }, { failure: true, entitled: true }).GET();
  assert.equal(response.status, 503); const body = await response.text(); assert.equal(body.includes("private database detail"), false); assert.equal(body.includes('"clauses"'), false);
});

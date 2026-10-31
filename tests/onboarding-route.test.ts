import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server.js";
import { loadRoute } from "./helpers/load-route.mjs";

test("onboarding saves only the signed-in profile, resumes saved progress, and reports failed writes", async () => {
  let signedIn = true, failProfile = false, failMetadata = false;
  let profile = { id: "owner", business_name: "Existing business", industry: "Retail" };
  let metadata: Record<string, unknown> = { onboarding: { vendor: "Cintas", monthlySpend: "Under $500", step: 3, completed: false } };
  const writes: unknown[] = [];
  const client = {
    auth: {
      getUser: async () => ({ data: { user: signedIn ? { id: "owner", user_metadata: metadata } : null } }),
      updateUser: async ({ data }: { data: Record<string, unknown> }) => {
        if (failMetadata) return { error: { message: "unavailable" } };
        metadata = { ...metadata, ...data }; return { error: null };
      },
    },
    from: (table: string) => {
      assert.equal(table, "profiles");
      let update: Record<string, unknown> | null = null;
      const chain = {
        select: () => chain,
        update: (value: Record<string, unknown>) => { update = value; return chain; },
        eq: (column: string, value: string) => { assert.equal(column, "id"); assert.equal(value, "owner"); return chain; },
        maybeSingle: async () => {
          if (failProfile) return { data: null, error: { message: "unavailable" } };
          if (update) { writes.push(update); profile = { ...profile, ...update }; }
          return { data: profile, error: null };
        },
      };
      return chain;
    },
  };
  const route = loadRoute("app/api/account/onboarding/route.ts", { "next/server": { NextResponse }, "@/lib/supabase/server": { createClient: async () => client } });
  const input = { business: " New business ", industry: "Healthcare", vendor: "Cintas", monthlySpend: "Under $500", step: 4, completed: true, userId: "other", plan: "pro" };
  const request = (body: unknown = input, origin = "https://example.test") => new NextRequest("https://example.test/api/account/onboarding", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
  assert.equal((await route.POST(request(input, "https://attacker.test"))).status, 403);
  signedIn = false;
  assert.equal((await route.GET()).status, 401);
  assert.equal((await route.POST(request())).status, 401);
  signedIn = true;
  assert.equal((await (await route.GET()).json()).step, 3);
  assert.equal((await route.POST(request({ ...input, business: "" }))).status, 400);
  failProfile = true;
  assert.equal((await route.POST(request())).status, 503);
  failProfile = false; failMetadata = true;
  assert.equal((await route.POST(request())).status, 503);
  failMetadata = false;
  assert.equal((await route.POST(request())).status, 200);
  const reopened = await (await route.GET()).json();
  assert.equal(reopened.business, "New business");
  assert.equal(reopened.completed, true);
  assert.equal(reopened.vendor, "Cintas");
  assert.deepEqual(JSON.parse(JSON.stringify(writes.at(-1))), { business_name: "New business", industry: "Healthcare" });
  assert.equal(metadata.plan, undefined);
});

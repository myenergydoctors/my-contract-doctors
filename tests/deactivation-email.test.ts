import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server.js";
import { loadRoute } from "./helpers/load-route.mjs";

test("deactivation email is owner-bound, stores only the token hash, and invalidates failed sends", async () => {
  let signedIn = true, failMail = false;
  let challenge: Record<string, string> | null = null;
  let delivered: { from: { email: string }; to: string; text: string } | null = null;
  let removed = false;
  const originalKey = process.env.SENDGRID_API_KEY;
  const route = loadRoute("app/api/account/deactivation-request/route.ts", {
    "next/server": { NextResponse },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: signedIn ? { id: "owner", email: "qa@example.invalid", email_confirmed_at: "2026-01-01" } : null } }) } }) },
    "@/lib/security/rate-limit": { checkRateLimit: async () => ({ allowed: true }) },
    "@/lib/supabase/admin": { createAdminClient: () => ({ from: (table: string) => {
      const filters: Array<[string, string]> = [];
      const chain = {
        select: () => chain,
        eq: (column: string, value: string) => { filters.push([column, value]); return chain; },
        maybeSingle: async () => { assert.ok(filters.some(([key, value]) => key === "id" && value === "owner")); return { data: { deactivated_at: null }, error: null }; },
        upsert: async (value: Record<string, string>) => { assert.equal(table, "account_deactivation_challenges"); challenge = value; return { error: null }; },
        insert: async () => { assert.equal(table, "account_lifecycle_events"); return { error: null }; },
        delete: () => { removed = true; return chain; },
        then: (resolve: (value: unknown) => void) => { assert.ok(filters.some(([key, value]) => key === "user_id" && value === "owner")); resolve({ error: null }); },
      };
      return chain;
    } }) },
    "@sendgrid/mail": { setApiKey: () => {}, send: async (mail: NonNullable<typeof delivered>) => { if (failMail) throw new Error("provider unavailable"); delivered = mail; } },
  });
  const request = (origin = "https://example.test") => new NextRequest("https://example.test/api/account/deactivation-request", { method: "POST", headers: { origin } });
  try {
    assert.equal((await route.POST(request("https://attacker.test"))).status, 403);
    signedIn = false;
    assert.equal((await route.POST(request())).status, 401);
    signedIn = true;
    delete process.env.SENDGRID_API_KEY;
    assert.equal((await route.POST(request())).status, 503);
    assert.equal(challenge, null);
    process.env.SENDGRID_API_KEY = "test-only-key";
    assert.equal((await route.POST(request())).status, 200);
    const mail = delivered as unknown as { from: { email: string }; to: string; text: string };
    const saved = challenge as unknown as Record<string, string>;
    assert.equal(mail.from.email, "help@mycontractdoctors.com");
    assert.equal(mail.to, "qa@example.invalid");
    const token = new URL(mail.text.match(/https:\/\/example\.test\/account\/deactivate\?token=[a-f0-9]+/)![0]).searchParams.get("token")!;
    assert.equal(saved.user_id, "owner");
    assert.equal(saved.token_hash, createHash("sha256").update(token).digest("hex"));
    assert.equal(JSON.stringify(saved).includes(token), false);
    failMail = true;
    assert.equal((await route.POST(request())).status, 503);
    assert.equal(removed, true);
  } finally {
    if (originalKey === undefined) delete process.env.SENDGRID_API_KEY;
    else process.env.SENDGRID_API_KEY = originalKey;
  }
});

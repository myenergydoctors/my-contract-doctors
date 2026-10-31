import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const approvedProjectRef = "xrchncayomnwcnphrwhx";
const configuredHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : "";
const enabled = process.env.ACCOUNT_E2E === "true"
  && process.env.ACCOUNT_E2E_PROJECT_REF === approvedProjectRef
  && configuredHost === `${approvedProjectRef}.supabase.co`
  && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

test("deactivation expires challenges, blocks account data, and retains the profile", { skip: !enabled }, async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const owner = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const email = `account-e2e-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  const created = await admin.auth.admin.createUser({ email, email_confirm: true, password });
  assert.ifError(created.error);
  const userId = created.data.user!.id;
  try {
    assert.ifError((await owner.auth.signInWithPassword({ email, password })).error);
    assert.equal((await owner.rpc("account_is_active")).data, true);
    assert.equal((await owner.from("profiles").select("id").eq("id", userId).maybeSingle()).data?.id, userId);

    const { data: membership, error: membershipError } = await admin.from("organization_members")
      .select("organization_id").eq("user_id", userId).single();
    assert.ifError(membershipError);
    assert.equal((await owner.rpc("is_organization_member", { p_organization_id: membership!.organization_id })).data, true);

    const tokenHash = createHash("sha256").update(randomBytes(32)).digest("hex");
    assert.ifError((await admin.from("account_deactivation_challenges").upsert({
      user_id: userId, token_hash: tokenHash, expires_at: new Date(Date.now() - 60_000).toISOString(), consumed_at: null,
    })).error);
    assert.equal((await admin.rpc("finalize_account_deactivation", { p_user_id: userId, p_token_hash: tokenHash })).data, false);
    assert.equal((await owner.rpc("account_is_active")).data, true);

    assert.ifError((await admin.from("account_deactivation_challenges").update({
      expires_at: new Date(Date.now() + 20 * 60_000).toISOString(),
    }).eq("user_id", userId)).error);
    assert.equal((await admin.rpc("finalize_account_deactivation", { p_user_id: userId, p_token_hash: "0".repeat(64) })).data, false);
    assert.equal((await admin.rpc("finalize_account_deactivation", { p_user_id: userId, p_token_hash: tokenHash })).data, true);
    assert.equal((await admin.rpc("finalize_account_deactivation", { p_user_id: userId, p_token_hash: tokenHash })).data, false);

    const { data: retained, error: retainedError } = await admin.from("profiles").select("id,deactivated_at").eq("id", userId).single();
    assert.ifError(retainedError);
    assert.equal(retained?.id, userId);
    assert.ok(retained?.deactivated_at);
    assert.equal((await owner.rpc("account_is_active")).data, false);
    assert.equal((await owner.rpc("is_organization_member", { p_organization_id: membership!.organization_id })).data, false);
    const ownerRead = await owner.from("profiles").select("id").eq("id", userId).maybeSingle();
    assert.ifError(ownerRead.error);
    assert.equal(ownerRead.data, null);
    const ownerWrite = await owner.from("profiles").update({ first_name: "Blocked" }).eq("id", userId).select("id");
    assert.ifError(ownerWrite.error);
    assert.equal(ownerWrite.data?.length, 0);
  } finally {
    assert.ifError((await admin.auth.admin.deleteUser(userId)).error);
  }
});

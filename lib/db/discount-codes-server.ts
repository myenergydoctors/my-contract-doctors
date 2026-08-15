import "server-only";

import { randomInt } from "node:crypto";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DiscountCodeRow } from "@/lib/supabase/database.types";

// Server-only helpers for discount codes. All reads/writes go through the
// admin (service-role) client — RLS on these tables has no policies, so
// this is the only path in. Callers MUST verify identity/admin status
// themselves before calling the admin-only functions below.

export async function requireAdminUser(): Promise<{ id: string } | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return null;
  return { id: user.id };
}

export async function listDiscountCodes(): Promise<DiscountCodeRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as DiscountCodeRow[];
}

export async function createDiscountCode(input: {
  code: string;
  plan: DiscountCodeRow["plan"];
  discount_pct: number;
  max_uses: number | null;
  note: string | null;
  expires_at: string | null;
  created_by: string;
}): Promise<{ ok: true; row: DiscountCodeRow } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("discount_codes")
    .insert({
      code: input.code.trim().toUpperCase(),
      plan: input.plan,
      discount_pct: input.discount_pct,
      max_uses: input.max_uses,
      note: input.note,
      expires_at: input.expires_at,
      created_by: input.created_by,
      source: "manual",
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data as DiscountCodeRow };
}

export async function setDiscountCodeActive(id: string, active: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from("discount_codes").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Look up a code by its text, case-insensitively.
async function findCode(code: string): Promise<DiscountCodeRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("discount_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as DiscountCodeRow) || null;
}

export async function validateDiscountCode(
  code: string,
  plan: string,
  identity: { userId?: string; email?: string }
): Promise<{ ok: true; row: DiscountCodeRow } | { ok: false; reason: string }> {
  const row = await findCode(code);
  if (!row) return { ok: false, reason: "We don't recognize that code." };
  if (!row.active) return { ok: false, reason: "That code is no longer active." };
  if (row.plan !== plan) return { ok: false, reason: `That code is only valid for ${row.plan}.` };
  if (row.expires_at && new Date(row.expires_at) < new Date()) return { ok: false, reason: "That code has expired." };
  if (row.max_uses !== null && row.times_redeemed >= row.max_uses) return { ok: false, reason: "That code has already been fully redeemed." };

  const admin = createAdminClient();
  if (identity.userId) {
    const { data, error } = await admin
      .from("discount_code_redemptions")
      .select("id")
      .eq("code_id", row.id)
      .eq("user_id", identity.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return { ok: false, reason: "You've already redeemed this code." };
  } else if (identity.email) {
    const { data, error } = await admin
      .from("discount_code_redemptions")
      .select("id")
      .eq("code_id", row.id)
      .ilike("email", identity.email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return { ok: false, reason: "You've already redeemed this code." };
  }

  return { ok: true, row };
}

export async function redeemDiscountCode(
  code: string,
  plan: string,
  identity: { userId?: string; email?: string }
): Promise<{ ok: true; row: DiscountCodeRow } | { ok: false; reason: string }> {
  const validation = await validateDiscountCode(code, plan, identity);
  if (validation.ok === false) return validation;

  const admin = createAdminClient();
  const { error: redemptionError } = await admin.from("discount_code_redemptions").insert({
    code_id: validation.row.id,
    user_id: identity.userId || null,
    email: identity.email || null,
  });
  // A unique-constraint hit here means a race with another simultaneous
  // redemption of the same code by the same identity — treat as "already redeemed".
  if (redemptionError) return { ok: false, reason: "You've already redeemed this code." };

  const { data: updated, error: updateError } = await admin
    .from("discount_codes")
    .update({ times_redeemed: validation.row.times_redeemed + 1 })
    .eq("id", validation.row.id)
    .select("*")
    .single();
  if (updateError) return { ok: false, reason: updateError.message };

  return { ok: true, row: updated as DiscountCodeRow };
}

// Chat-assistant single-use codes: identified by an opaque anon id the
// client generates and stores in localStorage (not a real identity, but
// stops the trivial "edit localStorage JSON" bypass the old client-only
// version had — the "used" flag now lives server-side).
export async function claimChatDiscountCode(anonId: string): Promise<DiscountCodeRow> {
  const admin = createAdminClient();

  const { data: existing, error: lookupError } = await admin
    .from("discount_codes")
    .select("*")
    .eq("claimed_by_anon_id", anonId)
    .eq("source", "chat-assistant")
    .eq("plan", "pro-annual")
    .maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  if (existing) return existing as DiscountCodeRow;

  const code = `MCD-PRO-${randomSegment(5)}`;
  const { data, error } = await admin
    .from("discount_codes")
    .insert({
      code,
      plan: "pro-annual",
      discount_pct: 0.10,
      max_uses: 1,
      source: "chat-assistant",
      claimed_by_anon_id: anonId,
      note: "Auto-issued by chat assistant",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as DiscountCodeRow;
}

function randomSegment(len: number): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // avoid 0/O, 1/I/L
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

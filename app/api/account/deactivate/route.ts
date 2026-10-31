import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to confirm deactivation." }, { status: 401, headers });
  const body: unknown = await request.json().catch(() => null);
  const token = body && typeof body === "object" && "token" in body ? (body as { token?: unknown }).token : null;
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: "Invalid confirmation link." }, { status: 400, headers });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("finalize_account_deactivation", { p_user_id: user.id, p_token_hash: tokenHash });
  if (error || data !== true) return NextResponse.json({ error: "Confirmation link expired or already used." }, { status: 409, headers });
  const { error: banError } = await admin.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
  if (banError) {
    console.error("Account auth ban failed after database deactivation:", banError.message);
    const { error: auditError } = await admin.from("account_lifecycle_events").insert({ user_id: user.id, event_type: "auth_ban_failed" });
    if (auditError) console.error("Account auth ban failure audit write failed:", auditError.message);
  }
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true }, { headers });
}

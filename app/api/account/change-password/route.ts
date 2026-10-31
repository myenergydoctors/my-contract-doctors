import { createClient as createAnonClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers });
  const body: unknown = await request.json().catch(() => null);
  const input = body && typeof body === "object" ? body as { currentPassword?: unknown; newPassword?: unknown } : null;
  if (typeof input?.currentPassword !== "string" || typeof input.newPassword !== "string" || input.newPassword.length < 8 || input.newPassword.length > 128 || input.currentPassword === input.newPassword) {
    return NextResponse.json({ error: "Enter your current password and a different new password of 8–128 characters." }, { status: 400, headers });
  }
  const limit = await checkRateLimit(request, { namespace: "account-password-change", maxRequests: 5, windowSeconds: 3600, identity: user.id });
  if (!limit.allowed) return rateLimitResponse(limit);
  const verifier = createAnonClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data: verified, error: signInError } = await verifier.auth.signInWithPassword({ email: user.email, password: input.currentPassword });
  if (signInError || verified.user?.id !== user.id) return NextResponse.json({ error: "Current password could not be verified. Use password recovery if you sign in by email link." }, { status: 403, headers });
  const { error: updateError } = await verifier.auth.updateUser({ password: input.newPassword });
  await verifier.auth.signOut({ scope: "local" });
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400, headers });
  const { error: auditError } = await createAdminClient().from("account_lifecycle_events").insert({ user_id: user.id, event_type: "password_changed" });
  if (auditError) console.error("Password change audit write failed:", auditError.message);
  return NextResponse.json({ ok: true }, { headers });
}

import { NextRequest, NextResponse } from "next/server";
import { recoveryCookie, validRecoveryGrant } from "@/lib/account/recovery-grant";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!user || !secret || !validRecoveryGrant(request.cookies.get(recoveryCookie)?.value, user.id, secret)) {
    return NextResponse.json({ error: "Reset link expired. Request another link." }, { status: 403, headers });
  }
  const body: unknown = await request.json().catch(() => null);
  const password = body && typeof body === "object" && "password" in body ? (body as { password?: unknown }).password : null;
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Use a password between 8 and 128 characters." }, { status: 400, headers });
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400, headers });
  const { error: auditError } = await createAdminClient().from("account_lifecycle_events").insert({ user_id: user.id, event_type: "password_reset" });
  if (auditError) console.error("Password reset audit write failed:", auditError.message);
  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.set(recoveryCookie, "", { path: "/", maxAge: 0 });
  return response;
}

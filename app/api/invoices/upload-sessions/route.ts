import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const limit = await checkRateLimit(request, {
    namespace: "invoice-phone-session",
    identity: user.id,
    maxRequests: 10,
    windowSeconds: 3600,
  });
  if (!limit.allowed) return rateLimitResponse(limit);

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const admin = createAdminClient();
  const { data, error } = await admin.from("invoice_upload_sessions").insert({
    user_id: user.id,
    token_hash: tokenHash(token),
    expires_at: expiresAt,
  }).select("id").single();
  if (error || !data) {
    console.error("Could not create invoice phone session:", error);
    return NextResponse.json({ error: "Phone upload could not be started." }, { status: 503 });
  }

  const uploadUrl = new URL("/upload", request.nextUrl.origin);
  uploadUrl.searchParams.set("session", data.id);
  uploadUrl.searchParams.set("token", token);
  return NextResponse.json({
    sessionId: data.id,
    token,
    uploadUrl: uploadUrl.toString(),
    expiresAt,
  }, { headers: { "Cache-Control": "no-store" } });
}

import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validToken(token: string, expectedHash: string): boolean {
  const actual = Buffer.from(createHash("sha256").update(token).digest("hex"));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { sessionId } = await context.params;
  const token = request.headers.get("x-upload-token") ?? "";
  const admin = createAdminClient();
  const { data, error } = await admin.from("agreement_upload_sessions")
    .select("id,user_id,token_hash,status,storage_path,original_filename,mime_type,file_size_bytes,expires_at")
    .eq("id", sessionId).eq("user_id", user.id).maybeSingle();
  if (error || !data || !token || !validToken(token, data.token_hash)) return NextResponse.json({ error: "Upload session not found." }, { status: 404 });
  const expired = new Date(data.expires_at).getTime() <= Date.now();
  if (expired && data.status === "awaiting_upload") await admin.from("agreement_upload_sessions").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", sessionId);
  return NextResponse.json({
    status: expired && data.status === "awaiting_upload" ? "expired" : data.status,
    file: data.status === "uploaded" ? { storagePath: data.storage_path, name: data.original_filename, type: data.mime_type, size: data.file_size_bytes } : null,
    expiresAt: data.expires_at,
  }, { headers: { "Cache-Control": "no-store" } });
}

import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"]);

function validToken(token: string, expectedHash: string): boolean {
  const actual = Buffer.from(createHash("sha256").update(token).digest("hex"));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const limit = await checkRateLimit(request, { namespace: "agreement-phone-upload", identity: sessionId, maxRequests: 5, windowSeconds: 1800 });
  if (!limit.allowed) return rateLimitResponse(limit);
  const token = request.headers.get("x-upload-token") ?? "";
  const admin = createAdminClient();
  const { data: session, error } = await admin.from("agreement_upload_sessions")
    .select("id,user_id,token_hash,status,expires_at").eq("id", sessionId).maybeSingle();
  if (error || !session || !token || !validToken(token, session.token_hash)) return NextResponse.json({ error: "Upload session not found." }, { status: 404 });
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await admin.from("agreement_upload_sessions").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", sessionId);
    return NextResponse.json({ error: "This upload link has expired." }, { status: 410 });
  }
  if (session.status !== "awaiting_upload") return NextResponse.json({ error: "This upload link has already been used." }, { status: 409 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES || !ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Choose a PDF, JPG, PNG, WEBP, or HEIC file smaller than 25 MB." }, { status: 400 });
  const { data: claimed, error: claimError } = await admin.from("agreement_upload_sessions")
    .update({ status: "uploading", updated_at: new Date().toISOString() }).eq("id", sessionId).eq("status", "awaiting_upload").select("id").maybeSingle();
  if (claimError || !claimed) return NextResponse.json({ error: "This upload link has already been used." }, { status: 409 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${session.user_id}/agreement-${Date.now()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from("invoices").upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) {
    await admin.from("agreement_upload_sessions").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", sessionId);
    return NextResponse.json({ error: "The agreement could not be sent to the desktop session." }, { status: 503 });
  }
  const { error: updateError } = await admin.from("agreement_upload_sessions").update({
    status: "uploaded", storage_bucket: "invoices", storage_path: storagePath,
    original_filename: file.name.slice(0, 255), mime_type: file.type, file_size_bytes: file.size,
    uploaded_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", sessionId);
  if (updateError) {
    await admin.storage.from("invoices").remove([storagePath]);
    return NextResponse.json({ error: "The upload could not be linked to the desktop session." }, { status: 503 });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

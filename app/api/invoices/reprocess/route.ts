import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Re-runs extraction against an existing uploaded file using the current
// prompt. Deletes the old invoice + line items + sibling invoices, then
// re-calls /api/invoices/extract with the original storage_path. Returns
// the new invoice_id so the client can redirect.

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { invoice_id } = (await req.json()) as { invoice_id?: string };
  if (!invoice_id) {
    return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });
  }

  const { data: inv, error: invErr } = await supabase
    .from("invoice_analyses")
    .select("id, user_id, file_path, parent_upload_id, vendor, state")
    .eq("id", invoice_id)
    .single();
  if (invErr || !inv) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (!inv.file_path) {
    return NextResponse.json({ error: "Invoice has no original file to re-process." }, { status: 400 });
  }

  // Determine the group of rows tied to this upload (self + siblings)
  const parentId = inv.parent_upload_id || inv.id;
  const { data: siblings } = await supabase
    .from("invoice_analyses")
    .select("id")
    .eq("parent_upload_id", parentId);
  const groupIds = new Set<string>([parentId, inv.id]);
  for (const s of siblings || []) groupIds.add(s.id);
  const ids = Array.from(groupIds);

  // Delete line items, extraction jobs, then invoice rows (children of cascade)
  await supabase.from("invoice_line_items").delete().in("invoice_id", ids);
  await supabase.from("invoice_extraction_jobs").delete().in("invoice_id", ids);
  await supabase.from("invoice_analyses").delete().in("id", ids);

  // Split bucket out of stored file_path ("{bucket}/{user_id}/{name}")
  const filePath = inv.file_path;
  const slash = filePath.indexOf("/");
  const bucket = slash >= 0 ? filePath.slice(0, slash) : "invoices";
  const storagePath = slash >= 0 ? filePath.slice(slash + 1) : filePath;

  // Forward cookies so /extract sees the same authenticated user
  const origin = req.nextUrl.origin;
  const cookieHeader = req.headers.get("cookie") || "";

  const extractRes = await fetch(`${origin}/api/invoices/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: cookieHeader },
    body: JSON.stringify({
      storage_path: storagePath,
      bucket,
      vendor_hint: inv.vendor ?? undefined,
      state_hint: inv.state ?? undefined,
    }),
  });

  const extractJson = await extractRes.json();
  if (!extractRes.ok) {
    return NextResponse.json({ error: "reprocess_failed", details: extractJson }, { status: extractRes.status });
  }
  return NextResponse.json({ ok: true, ...extractJson });
}

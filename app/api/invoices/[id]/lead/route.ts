import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
type CaptureBody = {
  stage: "capture";
  email: string;
  businessName?: string;
  marketingConsent: boolean;
};
type ResultBody = {
  stage: "result";
  findingCount: number;
  lockedFindingCount: number;
  freeFindingKind: string | null;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest, context: Context) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await context.params;
  const admin = createAdminClient();
  const { data: invoice, error: invoiceError } = await admin.from("invoice_analyses")
    .select("id,user_id,organization_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (invoiceError || !invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

  const body = await request.json() as CaptureBody | ResultBody;
  const now = new Date().toISOString();
  if (body.stage === "capture") {
    const email = body.email?.trim().toLowerCase();
    const businessName = body.businessName?.trim() || null;
    if (!email || email.length > 320 || !EMAIL.test(email)) {
      return NextResponse.json({ error: "Enter a valid results email." }, { status: 400 });
    }
    if (businessName && businessName.length > 200) {
      return NextResponse.json({ error: "Business name is too long." }, { status: 400 });
    }
    if (typeof body.marketingConsent !== "boolean") {
      return NextResponse.json({ error: "Marketing preference is required." }, { status: 400 });
    }
    const { error } = await admin.from("invoice_leads").upsert({
      user_id: user.id,
      organization_id: invoice.organization_id,
      invoice_analysis_id: invoice.id,
      email,
      business_name: businessName,
      marketing_consent: body.marketingConsent,
      consent_version: "invoice-results-v1",
      source: "invoice-flow",
      updated_at: now,
    }, { onConflict: "invoice_analysis_id" });
    if (error) {
      console.error("Could not save invoice lead:", error);
      return NextResponse.json({ error: "Your results email could not be saved." }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.stage === "result") {
    if (
      !Number.isInteger(body.findingCount) || body.findingCount < 0 || body.findingCount > 500 ||
      !Number.isInteger(body.lockedFindingCount) || body.lockedFindingCount < 0 || body.lockedFindingCount > body.findingCount ||
      (body.freeFindingKind !== null && (typeof body.freeFindingKind !== "string" || body.freeFindingKind.length > 100))
    ) {
      return NextResponse.json({ error: "Invalid result profile." }, { status: 400 });
    }
    const { error } = await admin.from("invoice_leads").update({
      finding_count: body.findingCount,
      locked_finding_count: body.lockedFindingCount,
      free_finding_kind: body.freeFindingKind,
      result_profiled_at: now,
      updated_at: now,
    }).eq("invoice_analysis_id", invoice.id).eq("user_id", user.id);
    if (error) {
      console.error("Could not profile invoice lead result:", error);
      return NextResponse.json({ error: "Result profile could not be saved." }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid lead stage." }, { status: 400 });
}

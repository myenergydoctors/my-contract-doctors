import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await context.params;
  const admin = createAdminClient();
  const { data: agreement } = await admin.from("agreement_analyses").select("id,user_id,organization_id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!agreement) return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  const body = await request.json() as { email?: string; businessName?: string; marketingConsent?: boolean };
  const email = body.email?.trim().toLowerCase();
  const businessName = body.businessName?.trim() || null;
  if (!email || email.length > 320 || !EMAIL.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (businessName && businessName.length > 200) return NextResponse.json({ error: "Business name is too long." }, { status: 400 });
  if (typeof body.marketingConsent !== "boolean") return NextResponse.json({ error: "Marketing preference is required." }, { status: 400 });
  const { error } = await admin.from("agreement_leads").upsert({
    user_id: user.id, organization_id: agreement.organization_id, agreement_analysis_id: id,
    email, business_name: businessName, marketing_consent: body.marketingConsent,
    consent_version: "agreement-results-v1", source: "agreement-flow", updated_at: new Date().toISOString(),
  }, { onConflict: "agreement_analysis_id" });
  if (error) {
    console.error("Could not save agreement lead:", error);
    return NextResponse.json({ error: "Your email could not be connected to this agreement." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}

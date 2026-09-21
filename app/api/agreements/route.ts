import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { data: active, error: activeError } = await supabase.rpc("account_is_active");
  if (activeError || !active) return NextResponse.json({ error: "Account access unavailable." }, { status: 403 });
  const { data, error } = await createAdminClient().from("agreement_analyses")
    .select("id,uploaded_at,vendor,agreement_name,risk_score,term_length,finding_count,review_status")
    .eq("user_id", user.id).order("uploaded_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load saved agreements." }, { status: 503 });
  return NextResponse.json({ agreements: (data ?? []).map(row => ({
    id: row.id, uploadedAt: row.uploaded_at, vendor: row.vendor ?? "Unknown", agreementName: row.agreement_name ?? "Service agreement",
    riskScore: row.review_status === "confirmed" ? row.risk_score ?? 0 : 0, termLength: row.term_length ?? "",
    findingCount: row.finding_count ?? 0, autoRenewal: "", topActions: [], clauses: [],
  })) }, { headers: { "Cache-Control": "no-store" } });
}

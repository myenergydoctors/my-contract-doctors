import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAgreementEmailTemplate, selectFreeAgreementFinding, type AgreementFinding } from "@/lib/agreement-recommendations";
import { isProAgreementPlan } from "@/lib/agreement-access";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await context.params;
  const admin = createAdminClient();
  const { data: agreement, error } = await admin.from("agreement_analyses").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !agreement) return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  const { data: profile } = await admin.from("profiles").select("plan,business_name").eq("id", user.id).maybeSingle();
  const { data: lead } = await admin.from("agreement_leads").select("business_name").eq("agreement_analysis_id", id).eq("user_id", user.id).maybeSingle();
  const { data: entitlement } = await admin.from("agreement_entitlements").select("id").eq("user_id", user.id).eq("agreement_analysis_id", id).eq("active", true).maybeSingle();
  const fullAccess = isProAgreementPlan(profile?.plan) || Boolean(entitlement);
  const findings = Array.isArray(agreement.clauses) ? agreement.clauses as AgreementFinding[] : [];
  const freeFinding = selectFreeAgreementFinding(findings);
  const visibleFindings = agreement.review_status === "confirmed" ? (fullAccess ? findings : freeFinding ? [freeFinding] : []) : [];
  const invoiceContext = await getInvoiceContext(admin, user.id, agreement.organization_id, agreement.vendor, findings);
  const { matchingInvoiceIds: _matchingInvoiceIds, ...publicInvoiceContext } = invoiceContext;
  return NextResponse.json({
    agreement: {
      id: agreement.id, status: agreement.status, reviewStatus: agreement.review_status,
      vendor: agreement.vendor, agreementName: agreement.agreement_name, agreementNumber: agreement.agreement_number,
      effectiveDate: agreement.effective_date, expirationDate: agreement.expiration_date,
      renewalDeadline: agreement.renewal_deadline, renewalNoticeDays: agreement.renewal_notice_days,
      termLength: agreement.term_length, autoRenewal: agreement.auto_renewal,
      riskScore: agreement.risk_score, pageCount: agreement.page_count,
      documentQuality: agreement.document_quality, documentQualityNotes: agreement.document_quality_notes,
      findingCount: findings.length, lockedFindingCount: fullAccess ? 0 : Math.max(0, findings.length - (freeFinding ? 1 : 0)),
      freeFindingKind: freeFinding?.kind ?? null, fullAccess,
      findings: visibleFindings.map(finding => ({
        ...finding,
        emailTemplate: fullAccess ? buildAgreementEmailTemplate(finding, { vendor: agreement.vendor, businessName: lead?.business_name ?? profile?.business_name ?? null }) : null,
      })),
      reviewOutline: agreement.review_status === "confirmed" ? [] : findings.map(finding => ({ id: finding.id, title: finding.title, sourcePage: finding.sourcePage })),
      invoiceContext: publicInvoiceContext,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await request.json() as { action?: string };
  if (body.action !== "confirm") return NextResponse.json({ error: "Invalid agreement action." }, { status: 400 });
  const { id } = await context.params;
  const admin = createAdminClient();
  const { data: agreement } = await admin.from("agreement_analyses").select("id,user_id,organization_id,vendor,status,clauses").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!agreement || agreement.status !== "completed") return NextResponse.json({ error: "Agreement is not ready to confirm." }, { status: 409 });
  const now = new Date().toISOString();
  const { error } = await admin.from("agreement_analyses").update({ review_status: "confirmed", confirmed_at: now, updated_at: now }).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Agreement confirmation could not be saved." }, { status: 503 });

  const findings = Array.isArray(agreement.clauses) ? agreement.clauses as AgreementFinding[] : [];
  const freeFinding = selectFreeAgreementFinding(findings);
  const invoiceContext = await getInvoiceContext(admin, user.id, agreement.organization_id, agreement.vendor, findings);
  if (invoiceContext.matchingInvoiceIds.length > 0) {
    await admin.from("agreement_invoice_links").upsert(invoiceContext.matchingInvoiceIds.map(invoiceId => ({
      agreement_analysis_id: id, invoice_analysis_id: invoiceId, organization_id: agreement.organization_id, match_method: "vendor-name",
    })), { onConflict: "agreement_analysis_id,invoice_analysis_id" });
  }
  await admin.from("agreement_leads").update({
    finding_count: findings.length, locked_finding_count: Math.max(0, findings.length - (freeFinding ? 1 : 0)),
    free_finding_kind: freeFinding?.kind ?? null, linked_invoice_count: invoiceContext.sameVendorInvoices,
    result_profiled_at: now, updated_at: now,
  }).eq("agreement_analysis_id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}

type AdminClient = ReturnType<typeof createAdminClient>;
async function getInvoiceContext(admin: AdminClient, userId: string, organizationId: string | null, vendor: string | null, findings: AgreementFinding[]) {
  const { data: invoices } = await admin.from("invoice_analyses").select("id,vendor,uploaded_at").eq("user_id", userId).eq("status", "completed");
  const all = invoices || [];
  const vendorKey = normalizeVendor(vendor);
  const matching = vendorKey ? all.filter(invoice => normalizeVendor(invoice.vendor) === vendorKey) : [];
  let floorMatLines = 0;
  if (matching.length > 0) {
    const { count } = await admin.from("invoice_line_items").select("id", { count: "exact", head: true }).in("invoice_id", matching.map(invoice => invoice.id)).or("raw_label.ilike.%mat%,confirmed_description.ilike.%mat%");
    floorMatLines = count ?? 0;
  }
  const kinds = new Set(findings.map(finding => finding.kind));
  const monitoringChecks: string[] = [];
  if (kinds.has("price_escalation")) monitoringChecks.push("Track future unit-rate changes against the agreement's increase language and notice requirements.");
  if (kinds.has("fee_rights")) monitoringChecks.push("Compare invoice surcharges and add-ons with the agreement's permitted-fee language.");
  if (kinds.has("minimum_commitment")) monitoringChecks.push("Check whether invoice minimums are driving charges above actual usage.");
  if (kinds.has("replacement_obligation") || floorMatLines > 0) monitoringChecks.push("Track replacement charges and ask when each billed item—such as a floor mat—was last replaced.");
  if (kinds.has("auto_renewal")) monitoringChecks.push("Keep the renewal notice deadline attached to the ongoing vendor record.");
  return { totalSavedInvoices: all.length, sameVendorInvoices: matching.length, matchingInvoiceIds: matching.map(invoice => invoice.id), floorMatLines, monitoringChecks };
}

function normalizeVendor(value: string | null): string {
  return (value || "").toLowerCase().replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, "").replace(/[^a-z0-9]/g, "");
}

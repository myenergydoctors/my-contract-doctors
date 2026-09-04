import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildInvoiceFindings, selectFreeInvoiceFinding } from "@/lib/invoice-recommendations";
import { isProInvoicePlan } from "@/lib/invoice-access";
import {
  getInvoiceReplacementHistory,
  saveInvoiceReplacementHistory,
  ServiceReplacementError,
} from "@/lib/db/service-replacement-history-server";
import {
  addInvoiceReviewLine,
  confirmInvoiceReview,
  excludeInvoiceReviewLine,
  getInvoiceReview,
  InvoiceReviewError,
  reopenInvoiceReview,
  saveInvoiceReviewLine,
  saveInvoiceReviewTotals,
} from "@/lib/db/invoice-review-server";
import type { EditableInvoiceLineFields, EditableInvoiceTotalFields } from "@/lib/invoice-review";
import type { ReplacementConfirmationInput } from "@/lib/service-replacement-history";

export const dynamic = "force-dynamic";

async function authenticatedUserId(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function errorResponse(error: unknown) {
  if (error instanceof InvoiceReviewError) {
    return NextResponse.json(
      { error: error.message, code: error.code, issues: error.issues ?? [] },
      { status: error.status },
    );
  }
  if (error instanceof ServiceReplacementError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error("Invoice review route failed:", error);
  return NextResponse.json({ error: "Invoice review could not be completed." }, { status: 500 });
}

type ReviewRouteContext = { params: Promise<{ id: string }> };

async function profileInvoiceLead(invoiceId: string, userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("invoice_line_items").select(`
    id,raw_label,confirmed_description,line_type,confirmed_line_type,quantity,confirmed_quantity,
    unit_price_cents,confirmed_unit_rate,raw_line_total_cents,confirmed_line_total_cents,
    billing_frequency,confirmed_billing_frequency,identification_status,annual_cost_cents,
    products ( slug, name, category )
  `).eq("invoice_id", invoiceId).eq("excluded_from_totals", false);
  if (error || !data) {
    console.error("Could not load confirmed findings for lead profile:", error);
    return;
  }
  const asNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const findings = buildInvoiceFindings((data as unknown as Array<Record<string, unknown>>).map(row => {
    const product = row.products as { slug?: string; name?: string; category?: string } | null;
    const confirmedRate = asNumber(row.confirmed_unit_rate);
    const rawStatus = String(row.identification_status || "unclassified");
    const identificationStatus = (["matched", "unclassified", "customer_unsure", "pending_review"] as const).find(status => status === rawStatus) ?? "unclassified";
    return {
      id: String(row.id),
      description: String(row.confirmed_description || row.raw_label || "Invoice charge"),
      lineType: String(row.confirmed_line_type || row.line_type || "charge"),
      productSlug: product?.slug ?? null,
      productName: product?.name ?? null,
      productCategory: product?.category ?? null,
      quantity: asNumber(row.confirmed_quantity) ?? asNumber(row.quantity),
      unitPriceCents: confirmedRate == null ? asNumber(row.unit_price_cents) : Math.round(confirmedRate * 100),
      lineTotalCents: asNumber(row.confirmed_line_total_cents) ?? asNumber(row.raw_line_total_cents),
      annualCostCents: asNumber(row.annual_cost_cents),
      billingFrequency: String(row.confirmed_billing_frequency || row.billing_frequency || "") || null,
      identificationStatus,
    };
  }));
  const freeFinding = selectFreeInvoiceFinding(findings);
  const { error: updateError } = await admin.from("invoice_leads").update({
    finding_count: findings.length,
    locked_finding_count: Math.max(0, findings.length - (freeFinding ? 1 : 0)),
    free_finding_kind: freeFinding?.kind ?? null,
    result_profiled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("invoice_analysis_id", invoiceId).eq("user_id", userId);
  if (updateError) console.error("Could not profile invoice lead result:", updateError);
}

export async function GET(_request: NextRequest, context: ReviewRouteContext) {
  const userId = await authenticatedUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  try {
    const { id } = await context.params;
    return NextResponse.json({ review: await getInvoiceReview(id, userId) });
  } catch (error) {
    return errorResponse(error);
  }
}

type ReviewAction =
  | { action: "save_line"; lineItemId: string; fields: EditableInvoiceLineFields }
  | { action: "add_line"; fields: EditableInvoiceLineFields }
  | { action: "exclude_line"; lineItemId: string }
  | { action: "save_totals"; fields: EditableInvoiceTotalFields }
  | { action: "confirm"; replacementResponses?: ReplacementConfirmationInput[] }
  | { action: "reopen" };

export async function PATCH(request: NextRequest, context: ReviewRouteContext) {
  const userId = await authenticatedUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const { id } = await context.params;
    const body = await request.json() as ReviewAction;
    let review;
    if (body.action === "save_line" && body.lineItemId && body.fields) {
      review = await saveInvoiceReviewLine(id, body.lineItemId, body.fields, userId);
    } else if (body.action === "add_line" && body.fields) {
      review = await addInvoiceReviewLine(id, body.fields, userId);
    } else if (body.action === "exclude_line" && body.lineItemId) {
      review = await excludeInvoiceReviewLine(id, body.lineItemId, userId);
    } else if (body.action === "save_totals" && body.fields) {
      review = await saveInvoiceReviewTotals(id, body.fields, userId);
    } else if (body.action === "confirm") {
      const admin = createAdminClient();
      const { data: profile, error: profileError } = await admin.from("profiles").select("plan").eq("id", userId).maybeSingle();
      if (profileError) throw profileError;
      if (isProInvoicePlan((profile as { plan?: string } | null)?.plan)) {
        const tracking = await getInvoiceReplacementHistory(id, userId);
        if (tracking.items.length > 0 && !tracking.alreadyAnswered) {
          if (!body.replacementResponses) {
            throw new ServiceReplacementError(
              "Answer the service and replacement questions before confirming this invoice.",
              400,
              "replacement_confirmation_required",
            );
          }
          const preflight = await getInvoiceReview(id, userId);
          if (preflight.redIssueCount > 0) {
            throw new InvoiceReviewError(
              "Resolve every red issue before confirming the invoice.",
              409,
              "red_issues_remaining",
              preflight.issues.filter(item => item.severity === "red"),
            );
          }
          await saveInvoiceReplacementHistory(id, body.replacementResponses, userId);
        }
      }
      review = await confirmInvoiceReview(id, userId);
      await profileInvoiceLead(id, userId);
    } else if (body.action === "reopen") {
      review = await reopenInvoiceReview(id, userId);
    } else {
      return NextResponse.json({ error: "Invalid review action." }, { status: 400 });
    }
    return NextResponse.json({ review });
  } catch (error) {
    return errorResponse(error);
  }
}

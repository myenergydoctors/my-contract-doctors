"use client";
import { createClient } from "@/lib/supabase/client";

export type LineType = "charge" | "credit" | "past_balance" | "late_fee" | "discount" | "tax" | "other";

// One row per line item, joined with product + vendor names for display.
export type LineItemForUI = {
  id: string;
  rawLabel: string;
  description: string;
  lineType: LineType;
  productSlug: string | null;
  productName: string | null;
  productCategory: string | null;
  vendorSlug: string | null;
  vendorName: string | null;
  quantity: number | null;
  unitPriceCents: number | null;
  lineTotalCents: number | null;
  billingFrequency: string | null;
  identificationStatus: "matched" | "unclassified" | "customer_unsure" | "pending_review";
  annualCostCents: number | null;
  flagged: boolean;
  flagReason: string | null;
  flagSeverity: "high" | "medium" | "low" | null;
  suggestedAction: string | null;
  estimatedSavingsCents: number | null;
};

export async function listLineItemsForInvoice(invoiceId: string): Promise<LineItemForUI[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoice_line_items")
    .select(`
      id,
      raw_label,
      confirmed_description,
      line_type,
      confirmed_line_type,
      quantity,
      confirmed_quantity,
      unit_price_cents,
      confirmed_unit_rate,
      raw_line_total_cents,
      confirmed_line_total_cents,
      billing_frequency,
      confirmed_billing_frequency,
      identification_status,
      annual_cost_cents,
      flagged,
      flag_reason,
      flag_severity,
      suggested_action,
      estimated_savings_cents,
      products ( slug, name, category ),
      vendors ( slug, name )
    `)
    .eq("invoice_id", invoiceId)
    .neq("review_status", "excluded")
    .order("line_type", { ascending: true }) // group charges, credits, etc.
    .order("flagged", { ascending: false })
    .order("annual_cost_cents", { ascending: false, nullsFirst: false });
  if (error || !data) return [];

  return (data as unknown as Array<{
    id: string;
    raw_label: string;
    confirmed_description: string | null;
    line_type: LineType | null;
    confirmed_line_type: LineType | null;
    quantity: number | null;
    confirmed_quantity: number | string | null;
    unit_price_cents: number | null;
    confirmed_unit_rate: number | string | null;
    raw_line_total_cents: number | null;
    confirmed_line_total_cents: number | null;
    billing_frequency: string | null;
    confirmed_billing_frequency: string | null;
    identification_status: "matched" | "unclassified" | "customer_unsure" | "pending_review" | null;
    annual_cost_cents: number | null;
    flagged: boolean;
    flag_reason: string | null;
    flag_severity: "high" | "medium" | "low" | null;
    suggested_action: string | null;
    estimated_savings_cents: number | null;
    products: { slug: string; name: string; category: string } | null;
    vendors: { slug: string; name: string } | null;
  }>).map(row => ({
    id: row.id,
    rawLabel: row.raw_label,
    description: row.confirmed_description ?? row.raw_label,
    lineType: (row.confirmed_line_type ?? row.line_type ?? "charge") as LineType,
    productSlug: row.products?.slug ?? null,
    productName: row.products?.name ?? null,
    productCategory: row.products?.category ?? null,
    vendorSlug: row.vendors?.slug ?? null,
    vendorName: row.vendors?.name ?? null,
    quantity: numberOrNull(row.confirmed_quantity) ?? row.quantity,
    unitPriceCents: centsFromRate(row.confirmed_unit_rate, row.unit_price_cents),
    lineTotalCents: row.confirmed_line_total_cents ?? row.raw_line_total_cents,
    billingFrequency: row.confirmed_billing_frequency ?? row.billing_frequency,
    identificationStatus: row.identification_status ?? "unclassified",
    annualCostCents: row.annual_cost_cents,
    flagged: row.flagged,
    flagReason: row.flag_reason,
    flagSeverity: row.flag_severity,
    suggestedAction: row.suggested_action,
    estimatedSavingsCents: row.estimated_savings_cents,
  }));
}

function numberOrNull(value: number | string | null): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function centsFromRate(value: number | string | null, fallback: number | null): number | null {
  const rate = numberOrNull(value);
  return rate == null ? fallback : Math.round(rate * 100);
}

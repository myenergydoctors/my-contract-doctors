"use client";
import { createClient } from "@/lib/supabase/client";

// One row per line item, joined with product + vendor names for display.
export type LineItemForUI = {
  id: string;
  rawLabel: string;
  productSlug: string | null;
  productName: string | null;
  productCategory: string | null;
  vendorSlug: string | null;
  vendorName: string | null;
  quantity: number | null;
  unitPriceCents: number | null;
  billingFrequency: string | null;
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
      quantity,
      unit_price_cents,
      billing_frequency,
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
    .order("flagged", { ascending: false })
    .order("annual_cost_cents", { ascending: false, nullsFirst: false });
  if (error || !data) return [];

  return (data as unknown as Array<{
    id: string;
    raw_label: string;
    quantity: number | null;
    unit_price_cents: number | null;
    billing_frequency: string | null;
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
    productSlug: row.products?.slug ?? null,
    productName: row.products?.name ?? null,
    productCategory: row.products?.category ?? null,
    vendorSlug: row.vendors?.slug ?? null,
    vendorName: row.vendors?.name ?? null,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    billingFrequency: row.billing_frequency,
    annualCostCents: row.annual_cost_cents,
    flagged: row.flagged,
    flagReason: row.flag_reason,
    flagSeverity: row.flag_severity,
    suggestedAction: row.suggested_action,
    estimatedSavingsCents: row.estimated_savings_cents,
  }));
}

"use client";
import { createClient } from "@/lib/supabase/client";
import type { InvoiceAnalysisRow } from "@/lib/supabase/database.types";

// Camel-case shape that the existing UI consumes. Mirrors the MockInvoice
// type in lib/mock-data.ts so the dashboard pages don't need to change.
export type InvoiceForUI = {
  id: string;
  uploadedAt: string;
  vendor: string;
  invoiceNumber: string;
  totalSpend: number;
  potentialAnnualSavings: number;
  flaggedItemCount: number;
  status: "processing" | "completed" | "failed";
  topFinding: string;
  lineItems: unknown[];
};

function toUI(row: InvoiceAnalysisRow): InvoiceForUI {
  return {
    id: row.id,
    uploadedAt: row.uploaded_at,
    vendor: row.vendor ?? "Unknown",
    invoiceNumber: row.invoice_number ?? "—",
    totalSpend: (row.total_spend_cents ?? 0) / 100,
    potentialAnnualSavings: (row.potential_annual_savings_cents ?? 0) / 100,
    flaggedItemCount: row.flagged_item_count,
    status: row.status,
    topFinding: row.top_finding ?? "",
    lineItems: row.line_items ?? [],
  };
}

export async function listInvoices(): Promise<InvoiceForUI[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoice_analyses")
    .select("*")
    .order("uploaded_at", { ascending: false });
  if (error || !data) return [];
  return (data as InvoiceAnalysisRow[]).map(toUI);
}

export async function getInvoice(id: string): Promise<InvoiceForUI | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoice_analyses")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return toUI(data as InvoiceAnalysisRow);
}

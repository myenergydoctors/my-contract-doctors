"use client";
import { createClient } from "@/lib/supabase/client";
import type { AgreementAnalysisRow } from "@/lib/supabase/database.types";

export type AgreementForUI = {
  id: string;
  uploadedAt: string;
  vendor: string;
  agreementName: string;
  riskScore: number;
  termLength: string;
  autoRenewal: string;
  topActions: { title: string; body: string; impact: number }[];
  clauses: unknown[];
};

function toUI(row: AgreementAnalysisRow): AgreementForUI {
  return {
    id: row.id,
    uploadedAt: row.uploaded_at,
    vendor: row.vendor ?? "Unknown",
    agreementName: row.agreement_name ?? "—",
    riskScore: row.risk_score ?? 0,
    termLength: row.term_length ?? "",
    autoRenewal: row.auto_renewal ?? "",
    topActions: (row.top_actions ?? []) as { title: string; body: string; impact: number }[],
    clauses: row.clauses ?? [],
  };
}

export async function listAgreements(): Promise<AgreementForUI[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agreement_analyses")
    .select("*")
    .order("uploaded_at", { ascending: false });
  if (error || !data) return [];
  return (data as AgreementAnalysisRow[]).map(toUI);
}

export async function getAgreement(id: string): Promise<AgreementForUI | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agreement_analyses")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return toUI(data as AgreementAnalysisRow);
}

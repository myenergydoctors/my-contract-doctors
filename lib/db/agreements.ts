"use client";

export type AgreementForUI = {
  id: string;
  uploadedAt: string;
  vendor: string;
  agreementName: string;
  riskScore: number;
  termLength: string;
  autoRenewal: string;
  findingCount: number;
  topActions: { title: string; body: string; impact: number }[];
  clauses: unknown[];
};

export async function listAgreements(): Promise<AgreementForUI[]> {
  const response = await fetch("/api/agreements", { cache: "no-store" });
  if (!response.ok) throw new Error("Saved agreements could not be loaded.");
  return (await response.json()).agreements;
}

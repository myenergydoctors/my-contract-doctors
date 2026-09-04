export type AgreementFindingKind =
  | "auto_renewal"
  | "price_escalation"
  | "early_termination"
  | "minimum_commitment"
  | "fee_rights"
  | "exclusivity"
  | "replacement_obligation"
  | "dispute_terms"
  | "other";

export type AgreementRisk = "high" | "medium" | "low";

export type AgreementClauseInput = {
  id: string;
  kind: AgreementFindingKind;
  title: string;
  risk: AgreementRisk;
  sourcePage: number | null;
  contractText: string;
  plainEnglish: string;
  recommendedAction: string;
  noticeDays: number | null;
  deadline: string | null;
  estimatedFinancialExposureCents: number | null;
};

export type AgreementFinding = AgreementClauseInput & { priority: number };

const PRIORITY: Record<AgreementFindingKind, number> = {
  auto_renewal: 0,
  price_escalation: 1,
  early_termination: 2,
  minimum_commitment: 3,
  fee_rights: 4,
  exclusivity: 5,
  replacement_obligation: 6,
  dispute_terms: 7,
  other: 8,
};

export function buildAgreementFindings(clauses: AgreementClauseInput[]): AgreementFinding[] {
  const seen = new Set<string>();
  return clauses
    .filter(clause => {
      if (!clause.id || !clause.contractText.trim() || seen.has(clause.id)) return false;
      seen.add(clause.id);
      return true;
    })
    .map(clause => ({ ...clause, priority: PRIORITY[clause.kind] ?? PRIORITY.other }))
    .sort((a, b) => a.priority - b.priority || riskRank(b.risk) - riskRank(a.risk) || a.id.localeCompare(b.id));
}

export function selectFreeAgreementFinding(findings: AgreementFinding[]): AgreementFinding | null {
  return findings[0] ?? null;
}

export function agreementRiskScore(findings: AgreementFinding[]): number {
  if (findings.length === 0) return 0;
  const points = findings.reduce((sum, finding) => sum + riskRank(finding.risk), 0);
  return Math.round((points / (findings.length * 3)) * 100);
}

export function buildAgreementEmailTemplate(
  finding: AgreementFinding,
  context: { vendor: string | null; businessName: string | null },
): { subject: string; body: string } {
  const vendor = context.vendor?.trim() || "Vendor";
  const business = context.businessName?.trim() || "[Business name]";
  const request = requestFor(finding.kind);
  return {
    subject: `Request to amend ${finding.title}`,
    body: `Hello ${vendor} team,\n\nWe are reviewing the ${finding.title} provision in our service agreement for ${business}. The current language states:\n\n“${finding.contractText.trim()}”\n\n${request}\n\nPlease send a written amendment reflecting this change for our review. Nothing in this message should be treated as a waiver of any rights or notice requirements under the current agreement.\n\nThank you,\n[Your name]\n${business}`,
  };
}

function requestFor(kind: AgreementFindingKind): string {
  switch (kind) {
    case "auto_renewal":
      return "We request that automatic renewal be removed and replaced with renewal only by mutual written agreement. Please also confirm the current non-renewal deadline and permitted delivery method in writing.";
    case "price_escalation":
      return "We request that increases be limited to once per 12-month period, require advance written notice, and be capped at the lesser of 3% or the applicable CPI change. We also request the right to reject an increase and terminate without penalty.";
    case "early_termination":
      return "We request that the early-termination charge be replaced with a reasonable, fixed amount tied to documented transition costs, with no charge following an uncured vendor breach.";
    case "minimum_commitment":
      return "We request that minimum billing and quantity commitments adjust to actual active usage, with reasonable reductions for closures, seasonal changes, and workforce decreases.";
    case "fee_rights":
      return "We request that all permitted fees be listed with a fixed calculation method, that new fees require advance written approval, and that unauthorized or unexplained fees be removed.";
    case "exclusivity":
      return "We request that exclusivity be limited to the specific services and locations listed in the agreement and exclude new locations, services the vendor cannot provide, and temporary or specialty needs.";
    case "replacement_obligation":
      return "We request a written replacement schedule, condition standard, and approval process before replacement charges are assessed, together with itemized proof of each replacement.";
    case "dispute_terms":
      return "We request a local, mutually convenient dispute venue and a reasonable period to raise billing or service disputes after discovery.";
    default:
      return "We request a written amendment that resolves this provision and clearly states the revised obligation, effective date, and any required notice procedure.";
  }
}

function riskRank(risk: AgreementRisk): number {
  return risk === "high" ? 3 : risk === "medium" ? 2 : 1;
}

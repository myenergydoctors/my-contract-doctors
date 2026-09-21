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
  sourceVerified?: boolean;
  assessment?: "obligation" | "protection" | "mixed" | "uncertain";
  contextQuotes?: { sourcePage: number | null; contractText: string; sourceVerified: boolean }[];
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
  const findings = clauses
    .filter(clause => {
      if (!clause.id || !clause.contractText.trim() || seen.has(clause.id)) return false;
      seen.add(clause.id);
      return true;
    })
    .map(clause => {
      const assessment = assessClause(clause);
      return { ...clause, assessment,
        plainEnglish: assessment === "protection" ? "The quoted language provides a customer protection. Its stated conditions still matter; do not treat it as an additional charge or commitment." : clause.plainEnglish,
        recommendedAction: assessment === "protection" ? "Preserve this protection. Ask the vendor to confirm how it applies; do not replace it with a new obligation." : clause.recommendedAction,
        risk: assessment === "protection" ? "low" as const : clause.risk,
        priority: assessment === "protection" ? 100 : PRIORITY[clause.kind] ?? PRIORITY.other };
    })
    .sort((a, b) => a.priority - b.priority || riskRank(b.risk) - riskRank(a.risk) || a.id.localeCompare(b.id));
  // Attach separately extracted exceptions/protections to the obligation they qualify.
  // Keep each source page and quote intact; do not splice them into a fabricated quote.
  const attached = new Set<string>();
  for (const finding of findings) {
    if (finding.assessment === "protection") continue;
    const protections = findings.filter(other => other.kind === finding.kind && other.assessment === "protection");
    if (!protections.length) continue;
    finding.contextQuotes = [...(finding.contextQuotes ?? []), ...protections.map(other => ({ sourcePage: other.sourcePage, contractText: other.contractText, sourceVerified: other.sourceVerified === true }))];
    finding.assessment = "mixed";
    for (const protection of protections) attached.add(protection.id);
  }
  return findings.filter(finding => !attached.has(finding.id));
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
): { subject: string; body: string } | null {
  if (finding.sourceVerified !== true || finding.contextQuotes?.some(quote => !quote.sourceVerified)) return null;
  const vendor = context.vendor?.trim() || "Vendor";
  const business = context.businessName?.trim() || "[Business name]";
  const protection = assessClause(finding) === "protection";
  const request = evidenceBasedRequest(finding);
  const contextText = (finding.contextQuotes ?? []).map(quote => `\n\nRelated protection${quote.sourcePage ? ` (page ${quote.sourcePage})` : ""}:\n“${quote.contractText.trim()}”`).join("");
  return {
    subject: `${protection ? "Confirm existing protection" : "Review of"}: ${finding.title}`,
    body: `Hello ${vendor} team,\n\nWe are reviewing the ${finding.title} provision in our service agreement for ${business}. The current language states:\n\n“${finding.contractText.trim()}”${contextText}\n\n${request}\n\nPlease respond in writing. Preserve all existing customer protections, exceptions, notice rights, and any more favorable terms. Any proposed change is subject to our review and agreement. This message does not give termination or non-renewal notice or waive any existing rights.\n\nThank you,\n[Your name]\n${business}`,
  };
}

export function assessClause(clause: AgreementClauseInput): "obligation" | "protection" | "mixed" | "uncertain" {
  const text = clause.contractText.toLowerCase();
  // Narrow source-based guards protect legacy saved results as well as new output.
  const protection = /\bno\s+(?:minimum\s+billing|termination\s+fee|cancellation\s+(?:fee|charge)|additional\s+(?:service\s+)?fees)\b|\b(?:fees?|charges?)\s+(?:do|does|shall|will)\s+not\s+apply\b|\bwithout\s+(?:the\s+)?customer(?:'s)?\s+(?:prior\s+)?written\s+(?:approval|consent)\b/.test(text);
  const obligation = /\b(?:requires?\s+(?:a\s+)?(?:fixed\s+)?fee|customer\s+(?:must|shall)\s+pay|minimum\s+(?:weekly\s+)?billing\s+(?:of|is)|cancellation\s+charge\s+of|automatically\s+renew)/.test(text);
  if (protection) return obligation || /\b(?:unless|except|however)\b/.test(text) ? "mixed" : "protection";
  return clause.assessment ?? "uncertain";
}

function evidenceBasedRequest(finding: AgreementFinding): string {
  if (assessClause(finding) === "protection") return "Please confirm that this existing customer protection remains in force and explain how it applies to our account. We are not requesting that it be removed, narrowed, or replaced with a new minimum, fee, or commitment.";
  const text = finding.contractText.toLowerCase();
  if (finding.kind === "auto_renewal" && /automatically\s+renew|renew(?:s|ed)?\s+automatically|automatic\s+renewal/.test(text) && !/\b(?:not|no)\b.{0,30}(?:automatically|automatic)/.test(text)) {
    return "We request that automatic renewal be removed and replaced with renewal only by mutual written agreement. Please also confirm the current non-renewal deadline and permitted delivery method in writing.";
  }
  const topics: Record<AgreementFindingKind, string> = {
    auto_renewal: "the renewal mechanism, deadline, and required delivery method",
    price_escalation: "the permitted increase, frequency, cap, and advance notice",
    early_termination: "the termination charge, its calculation, and every exception that waives or reduces it",
    minimum_commitment: "whether this text creates any minimum charge or quantity obligation, and when reductions are allowed",
    fee_rights: "which fees this text permits, their calculations, and any required customer approval",
    exclusivity: "the services and locations covered, and all exceptions to exclusivity",
    replacement_obligation: "the replacement standard, evidence, charges, and required approvals",
    dispute_terms: "the dispute process, venue, notice requirements, and deadlines",
    other: "the specific obligation and any limitations or exceptions",
  };
  return `For the exact language quoted above, please confirm ${topics[finding.kind] ?? topics.other}. Identify the controlling contract text in your reply. If this provision imposes a charge or restriction on us, please propose a written change reducing or removing that burden while preserving all existing protections and more favorable terms.`;
}

function riskRank(risk: AgreementRisk): number {
  return risk === "high" ? 3 : risk === "medium" ? 2 : 1;
}

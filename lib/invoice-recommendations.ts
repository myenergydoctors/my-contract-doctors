export const MOCK_FLOOR_MAT_UNIT_PRICE_CENTS = 7_500;
export const FREE_RECOMMENDATION_VERSION = "floor-mat-buy-v1";

export type RecommendationLine = {
  id: string;
  description: string;
  lineType: string;
  productSlug: string | null;
  productName: string | null;
  productCategory: string | null;
  quantity: number | null;
  unitPriceCents: number | null;
  lineTotalCents: number | null;
  annualCostCents?: number | null;
  billingFrequency: string | null;
  identificationStatus: "matched" | "unclassified" | "customer_unsure" | "pending_review";
};

export type FreeSavingsRecommendation = {
  version: string;
  lineItemId: string;
  itemName: string;
  quantity: number;
  billingFrequency: string;
  currentPeriodCostCents: number;
  periodsPerYear: number;
  annualRentalCostCents: number;
  purchaseUnitPriceCents: number;
  purchaseCostCents: number;
  firstYearSavingsCents: number;
  laterYearSavingsCents: number;
  paybackWeeks: number;
};

const FREQUENCY_MULTIPLIERS: Record<string, number> = {
  weekly: 52,
  biweekly: 26,
  "bi-weekly": 26,
  "every other week": 26,
  semimonthly: 24,
  "semi-monthly": 24,
  monthly: 12,
  quarterly: 4,
  annual: 1,
  annually: 1,
  yearly: 1,
};

export function periodsPerYear(frequency: string | null): number | null {
  if (!frequency) return null;
  return FREQUENCY_MULTIPLIERS[frequency.trim().toLowerCase()] ?? null;
}

function isFloorMat(line: RecommendationLine): boolean {
  const category = line.productCategory?.trim().toLowerCase() ?? "";
  const slug = line.productSlug?.trim().toLowerCase() ?? "";
  const label = `${line.productName ?? ""} ${line.description}`.toLowerCase();

  if (category === "mats" || category === "floor mats" || slug.startsWith("mat-")) return true;
  return /\b(floor\s*mat|entrance\s*mat|logo\s*mat|scraper\s*mat|active\s*scraper)\b/.test(label);
}

function candidateFor(line: RecommendationLine): FreeSavingsRecommendation | null {
  if (line.lineType !== "charge" || line.identificationStatus !== "matched" || !isFloorMat(line)) return null;

  const periods = periodsPerYear(line.billingFrequency);
  const rawQuantity = line.quantity;
  if (!periods || rawQuantity == null || rawQuantity <= 0) return null;

  const quantity = Math.max(1, Math.ceil(rawQuantity));
  const calculatedLineTotal = line.unitPriceCents == null
    ? null
    : Math.round(line.unitPriceCents * rawQuantity);
  const currentPeriodCostCents = line.lineTotalCents ?? calculatedLineTotal;
  if (currentPeriodCostCents == null || currentPeriodCostCents <= 0) return null;

  const annualRentalCostCents = Math.round(currentPeriodCostCents * periods);
  const purchaseCostCents = quantity * MOCK_FLOOR_MAT_UNIT_PRICE_CENTS;
  const firstYearSavingsCents = annualRentalCostCents - purchaseCostCents;
  if (firstYearSavingsCents <= 0) return null;

  const paybackWeeks = Math.max(1, Math.ceil((purchaseCostCents / annualRentalCostCents) * 52));
  return {
    version: FREE_RECOMMENDATION_VERSION,
    lineItemId: line.id,
    itemName: line.productName || line.description,
    quantity,
    billingFrequency: line.billingFrequency!.trim().toLowerCase(),
    currentPeriodCostCents,
    periodsPerYear: periods,
    annualRentalCostCents,
    purchaseUnitPriceCents: MOCK_FLOOR_MAT_UNIT_PRICE_CENTS,
    purchaseCostCents,
    firstYearSavingsCents,
    laterYearSavingsCents: annualRentalCostCents,
    paybackWeeks,
  };
}

export function selectFreeSavingsRecommendation(
  lines: RecommendationLine[],
): FreeSavingsRecommendation | null {
  return lines
    .map(candidateFor)
    .filter((candidate): candidate is FreeSavingsRecommendation => candidate !== null)
    .sort((a, b) => b.firstYearSavingsCents - a.firstYearSavingsCents)[0] ?? null;
}

export type InvoiceFindingKind =
  | "floor_mat_purchase"
  | "late_fee"
  | "service_fee"
  | "unknown_charge"
  | "largest_recurring_charge";

export type InvoiceFinding = {
  id: string;
  kind: InvoiceFindingKind;
  lineItemId: string;
  title: string;
  summary: string;
  action: string;
  annualImpactCents: number | null;
  isSavingsEstimate: boolean;
};

function annualizedCost(line: RecommendationLine): number | null {
  const periods = periodsPerYear(line.billingFrequency);
  const periodCost = line.lineTotalCents ?? (
    line.quantity != null && line.unitPriceCents != null
      ? Math.round(line.quantity * line.unitPriceCents)
      : null
  );
  if (periods && periodCost != null && periodCost > 0) return Math.round(periodCost * periods);
  return line.annualCostCents != null && line.annualCostCents > 0 ? line.annualCostCents : null;
}

function isServiceFee(line: RecommendationLine): boolean {
  return /\b(service|delivery|fuel|environmental|energy|facility|minimum|admin(?:istrative)?|stop)\s+(?:charge|fee|surcharge)\b/i.test(line.description);
}

export function buildInvoiceFindings(lines: RecommendationLine[]): InvoiceFinding[] {
  const findings: InvoiceFinding[] = [];
  const freeSavings = selectFreeSavingsRecommendation(lines);
  if (freeSavings) {
    findings.push({
      id: `floor-mat:${freeSavings.lineItemId}`,
      kind: "floor_mat_purchase",
      lineItemId: freeSavings.lineItemId,
      title: "Consider owning these mats instead of renting them",
      summary: `The confirmed rental line annualizes to $${(freeSavings.annualRentalCostCents / 100).toFixed(2)}. The preview purchase cost is $${(freeSavings.purchaseCostCents / 100).toFixed(2)}.`,
      action: "Check the agreement to confirm the rental line can be removed before purchasing replacements.",
      annualImpactCents: freeSavings.firstYearSavingsCents,
      isSavingsEstimate: true,
    });
  }

  for (const line of lines) {
    const lineAmount = line.lineTotalCents ?? (line.quantity != null && line.unitPriceCents != null ? Math.round(line.quantity * line.unitPriceCents) : null);
    const serviceFee = line.lineType === "charge" && isServiceFee(line);
    if (line.lineType === "late_fee" && lineAmount != null && lineAmount > 0) {
      findings.push({
        id: `late-fee:${line.id}`,
        kind: "late_fee",
        lineItemId: line.id,
        title: "A late fee appears on this invoice",
        summary: `The confirmed invoice includes a $${(lineAmount / 100).toFixed(2)} late or finance charge.`,
        action: "Ask what triggered it, whether it can be waived, and what process prevents it next cycle.",
        annualImpactCents: lineAmount,
        isSavingsEstimate: false,
      });
    }
    if (serviceFee) {
      findings.push({
        id: `service-fee:${line.id}`,
        kind: "service_fee",
        lineItemId: line.id,
        title: "A separate service or surcharge line is present",
        summary: `“${line.description}” is billed separately from the identified products.`,
        action: "Compare this line with the agreement and ask the vendor what authorizes it and how it is calculated.",
        annualImpactCents: annualizedCost(line),
        isSavingsEstimate: false,
      });
    }
    if (!serviceFee && line.lineType === "charge" && (line.identificationStatus === "customer_unsure" || line.identificationStatus === "unclassified")) {
      findings.push({
        id: `unknown:${line.id}`,
        kind: "unknown_charge",
        lineItemId: line.id,
        title: "A charge still needs a plain-English explanation",
        summary: `“${line.description}” remains in the total but is not being treated as a known product.`,
        action: "Ask the vendor what the charge covers, its unit basis, and where it is authorized in the agreement.",
        annualImpactCents: annualizedCost(line),
        isSavingsEstimate: false,
      });
    }
  }

  const linesAlreadyRepresented = new Set(findings.map(finding => finding.lineItemId));
  const largest = lines
    .filter(line => line.lineType === "charge" && !linesAlreadyRepresented.has(line.id))
    .map(line => ({ line, annual: annualizedCost(line) }))
    .filter((entry): entry is { line: RecommendationLine; annual: number } => entry.annual != null && entry.annual > 0)
    .sort((a, b) => b.annual - a.annual || a.line.id.localeCompare(b.line.id))[0];
  if (largest) {
    findings.push({
      id: `largest:${largest.line.id}`,
      kind: "largest_recurring_charge",
      lineItemId: largest.line.id,
      title: "Start with the largest confirmed recurring charge",
      summary: `“${largest.line.productName || largest.line.description}” annualizes to $${(largest.annual / 100).toFixed(2)} using the confirmed billing frequency.`,
      action: "Verify the quantity and rate against the agreement, then prioritize this line for a competitive quote.",
      annualImpactCents: largest.annual,
      isSavingsEstimate: false,
    });
  }

  return findings.sort((a, b) => {
    const priority: Record<InvoiceFindingKind, number> = {
      floor_mat_purchase: 0,
      late_fee: 1,
      service_fee: 2,
      unknown_charge: 3,
      largest_recurring_charge: 4,
    };
    return priority[a.kind] - priority[b.kind] || a.id.localeCompare(b.id);
  });
}

export function selectFreeInvoiceFinding(findings: InvoiceFinding[]): InvoiceFinding | null {
  return findings[0] ?? null;
}

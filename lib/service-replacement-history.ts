export const REPLACEMENT_TRACKING_CATEGORIES = [
  "floor_mat_physical_replacement",
  "soap_dispenser",
  "air_care_dispenser",
  "paper_towel_dispenser",
  "toilet_tissue_dispenser",
] as const;

export type ReplacementTrackingCategory = (typeof REPLACEMENT_TRACKING_CATEGORIES)[number];
export type ReplacementTrackingEligibility = "unreviewed" | "eligible" | "ineligible";
export type ReplacementResponse = "replaced" | "not_replaced" | "not_sure" | "dont_track";
export type ReplacementDatePrecision = "exact" | "approximate" | "unknown";
export type ReplacementBaselineStatus = "last_replaced" | "approximately_replaced" | "never_replaced" | "unknown";
export type ReplacementReportedSource = "vendor" | "facility_manager" | "customer" | "service_record" | "other" | "unknown";
export type ReplacementFollowUpAction = "ask_vendor" | "assign_facility_manager";

export const REPLACEMENT_CATEGORY_LABELS: Record<ReplacementTrackingCategory, string> = {
  floor_mat_physical_replacement: "Floor-mat physical replacement",
  soap_dispenser: "Soap dispenser",
  air_care_dispenser: "Odor-control / air-care dispenser",
  paper_towel_dispenser: "Paper towel dispenser",
  toilet_tissue_dispenser: "Toilet tissue dispenser",
};

export type ReplacementEvidenceInput = {
  name: string;
  mediaType: string;
  size: number;
  base64: string;
};

export type ReplacementBaselineInput = {
  status: ReplacementBaselineStatus;
  replacementDate: string | null;
};

export type ReplacementEventInput = {
  datePrecision: ReplacementDatePrecision;
  replacementDate: string | null;
  quantity: number | null;
  facility: string;
  source: ReplacementReportedSource;
  notes: string | null;
  evidence?: ReplacementEvidenceInput | null;
};

export type ReplacementConfirmationInput = {
  vendorProductId: string;
  response: ReplacementResponse;
  facility: string;
  baseline?: ReplacementBaselineInput | null;
  replacement?: ReplacementEventInput | null;
  followUpAction?: ReplacementFollowUpAction | null;
};

export type ReplacementFacts = {
  response: ReplacementResponse;
  baseline: ReplacementBaselineInput | null;
  event: ReplacementEventInput | null;
  followUpAction: ReplacementFollowUpAction | null;
  disablesTracking: boolean;
};

export type EligibleReplacementProduct = {
  id: string;
  catalogStatus: string;
  eligibility: ReplacementTrackingEligibility;
  category: ReplacementTrackingCategory | null;
  suggestedCategory?: ReplacementTrackingCategory | null;
};

export function isReplacementTrackingCategory(value: unknown): value is ReplacementTrackingCategory {
  return typeof value === "string" && (REPLACEMENT_TRACKING_CATEGORIES as readonly string[]).includes(value);
}

export function isExplicitlyEligibleProduct(product: EligibleReplacementProduct): boolean {
  return product.catalogStatus === "approved"
    && product.eligibility === "eligible"
    && isReplacementTrackingCategory(product.category);
}

export function validateReplacementConfirmation(
  input: ReplacementConfirmationInput,
  requiresBaseline: boolean,
): string[] {
  const errors: string[] = [];
  if (!["replaced", "not_replaced", "not_sure", "dont_track"].includes(input.response)) errors.push("Choose a valid replacement answer.");
  if (!input.vendorProductId) errors.push("A tracked product is required.");
  if (!(input.facility || "").trim()) errors.push("Facility is required.");
  if ((input.facility || "").trim().length > 200) errors.push("Facility must be 200 characters or fewer.");

  if (requiresBaseline && input.response !== "dont_track") {
    if (!input.baseline) {
      errors.push("A starting replacement history is required.");
    } else {
      if (!["last_replaced", "approximately_replaced", "never_replaced", "unknown"].includes(input.baseline.status)) {
        errors.push("Choose a valid starting replacement history.");
      } else if (
        (input.baseline.status === "last_replaced" || input.baseline.status === "approximately_replaced")
        && !isIsoDate(input.baseline.replacementDate)
      ) {
        errors.push("The baseline replacement date is required.");
      }
    }
  }

  if (input.response === "replaced") {
    const replacement = input.replacement;
    if (!replacement) {
      errors.push("Replacement details are required.");
    } else {
      if (!["exact", "approximate", "unknown"].includes(replacement.datePrecision)) errors.push("Choose a valid replacement date precision.");
      if (!["vendor", "facility_manager", "customer", "service_record", "other", "unknown"].includes(replacement.source)) errors.push("Choose a valid replacement source.");
      if (!(replacement.facility || "").trim()) errors.push("Replacement facility is required.");
      if ((replacement.facility || "").trim().toLowerCase() !== (input.facility || "").trim().toLowerCase()) {
        errors.push("Replacement facility must match the tracked facility.");
      }
      if (replacement.datePrecision !== "unknown" && !isIsoDate(replacement.replacementDate)) {
        errors.push("Replacement date is required unless the date is unknown.");
      }
      if (replacement.datePrecision === "unknown" && replacement.replacementDate) {
        errors.push("An unknown replacement date cannot include an exact date.");
      }
      if (replacement.quantity == null || !Number.isFinite(replacement.quantity) || replacement.quantity <= 0) {
        errors.push("Replacement quantity must be greater than zero.");
      }
      if (replacement.notes && replacement.notes.length > 2000) errors.push("Notes must be 2,000 characters or fewer.");
      if (replacement.evidence) {
        if (replacement.evidence.size > 5 * 1024 * 1024) errors.push("Evidence must be 5 MB or smaller.");
        if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(replacement.evidence.mediaType)) {
          errors.push("Evidence must be a JPG, PNG, WebP, or PDF file.");
        }
      }
    }
  }

  if (input.response === "not_sure" && input.followUpAction && !["ask_vendor", "assign_facility_manager"].includes(input.followUpAction)) {
    errors.push("Unknown follow-up action.");
  }
  return errors;
}

export function replacementFactsForConfirmation(input: ReplacementConfirmationInput): ReplacementFacts {
  return {
    response: input.response,
    baseline: input.response === "dont_track" ? null : input.baseline ?? null,
    event: input.response === "replaced" ? input.replacement ?? null : null,
    followUpAction: input.response === "not_sure" ? input.followUpAction ?? null : null,
    disablesTracking: input.response === "dont_track",
  };
}

export type BilledLineForReplacement = {
  invoiceId: string;
  periodKey: string;
  effectiveDate: string | null;
  lineTotalCents: number | null;
};

export function summarizeBilledActivitySince(
  lines: BilledLineForReplacement[],
  replacementDate: string | null,
  confirmedAt: string,
): { billedPeriods: number; ongoingFeesCents: number } {
  const boundary = Date.parse(replacementDate || confirmedAt);
  const relevant = lines.filter(line => {
    if (!line.effectiveDate) return false;
    const value = Date.parse(line.effectiveDate);
    return Number.isFinite(value) && value > boundary;
  });
  return {
    billedPeriods: new Set(relevant.map(line => line.periodKey || line.invoiceId)).size,
    ongoingFeesCents: relevant.reduce((total, line) => total + Math.max(0, line.lineTotalCents ?? 0), 0),
  };
}

function isIsoDate(value: string | null | undefined): boolean {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

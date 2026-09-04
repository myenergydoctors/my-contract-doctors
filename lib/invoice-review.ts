export const INVOICE_LINE_TYPES = [
  "charge",
  "credit",
  "past_balance",
  "late_fee",
  "discount",
  "tax",
  "other",
] as const;

export type InvoiceLineType = (typeof INVOICE_LINE_TYPES)[number];
export type ReviewSeverity = "none" | "yellow" | "red";
export type InvoiceLineIdentificationStatus = "matched" | "unclassified" | "customer_unsure" | "pending_review";
export type InvoiceReviewStatus =
  | "not_started"
  | "needs_review"
  | "ready_for_confirmation"
  | "confirmed"
  | "reopened";

export type InvoiceReviewIssue = {
  severity: Exclude<ReviewSeverity, "none">;
  code: string;
  message: string;
  lineItemId: string | null;
};

export type InvoiceReviewLine = {
  id: string;
  vendorItemCode: string | null;
  description: string;
  quantity: number | null;
  unitRate: number | null;
  lineTotalCents: number | null;
  billingFrequency: string | null;
  lineType: InvoiceLineType;
  reviewStatus: string;
  reviewSeverity: ReviewSeverity;
  extractionConfidence: number | null;
  identificationStatus: InvoiceLineIdentificationStatus;
  issues: InvoiceReviewIssue[];
};

export type InvoiceReviewTotals = {
  grossChargesCents: number | null;
  creditsCents: number;
  pastBalanceCents: number;
  lateFeesCents: number;
  taxesCents: number;
  totalDueCents: number | null;
  computedTotalCents: number | null;
  differenceCents: number | null;
};

export type InvoiceDocumentSegment = {
  id: string;
  pageStart: number;
  pageEnd: number;
  documentType: "invoice" | "agreement" | "statement" | "purchase-order" | "receipt" | "other";
  confidence: number;
  reason: string | null;
  reviewStatus: string;
  completenessStatus: "complete" | "possibly_incomplete" | "incomplete";
  completenessNotes: string | null;
};

export type InvoiceReviewDTO = {
  invoiceId: string;
  vendorName: string;
  invoiceNumber: string;
  status: InvoiceReviewStatus;
  reviewVersion: number;
  reviewedAt: string | null;
  totals: InvoiceReviewTotals;
  documentSegments: InvoiceDocumentSegment[];
  lines: InvoiceReviewLine[];
  issues: InvoiceReviewIssue[];
  redIssueCount: number;
  yellowIssueCount: number;
};

export type EditableInvoiceLineFields = {
  description?: string;
  quantity?: number | null;
  unitRate?: number | null;
  lineTotalCents?: number | null;
  billingFrequency?: string | null;
  lineType?: InvoiceLineType;
  identificationStatus?: InvoiceLineIdentificationStatus;
};

export type EditableInvoiceTotalFields = Partial<{
  grossChargesCents: number | null;
  creditsCents: number;
  pastBalanceCents: number;
  lateFeesCents: number;
  taxesCents: number;
  totalDueCents: number | null;
}>;

export function isFlatServiceFee(description: string): boolean {
  return /\b(?:facility\s+|route\s+)?service\s+(?:charge|fee)\b/i.test(description.trim());
}

export function orderInvoiceLinesForReview<T extends { description: string }>(lines: T[]): T[] {
  return lines
    .map((line, sourceIndex) => ({ line, sourceIndex }))
    .sort((left, right) => {
      const serviceFeeOrder = Number(isFlatServiceFee(left.line.description)) - Number(isFlatServiceFee(right.line.description));
      return serviceFeeOrder || left.sourceIndex - right.sourceIndex;
    })
    .map(({ line }) => line);
}

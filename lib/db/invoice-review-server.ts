import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  INVOICE_LINE_TYPES,
  isFlatServiceFee,
  orderInvoiceLinesForReview,
  type EditableInvoiceLineFields,
  type EditableInvoiceTotalFields,
  type InvoiceLineIdentificationStatus,
  type InvoiceLineType,
  type InvoiceDocumentSegment,
  type InvoiceReviewDTO,
  type InvoiceReviewIssue,
  type InvoiceReviewLine,
  type ReviewSeverity,
} from "@/lib/invoice-review";

const RECONCILIATION_TOLERANCE_CENTS = 100;

type InvoiceRow = {
  id: string;
  user_id: string;
  organization_id: string | null;
  document_upload_id: string | null;
  source_classification_revision: number | null;
  vendor: string | null;
  vendor_id: string | null;
  invoice_number: string | null;
  state: string | null;
  zip: string | null;
  review_status: InvoiceReviewDTO["status"] | null;
  review_version: number | null;
  reviewed_at: string | null;
  gross_charges_cents: number | null;
  credits_cents: number | null;
  past_balance_cents: number | null;
  late_fees_cents: number | null;
  taxes_cents: number | null;
  total_due_cents: number | null;
};

type SegmentRow = {
  id: string;
  page_start: number;
  page_end: number;
  detected_type: InvoiceDocumentSegment["documentType"];
  confidence: number | string;
  reason: string | null;
  review_status: string;
  completeness_status: InvoiceDocumentSegment["completenessStatus"];
  completeness_notes: string | null;
};

type LineRow = {
  id: string;
  invoice_id: string;
  user_id: string;
  organization_id: string | null;
  vendor_item_code: string | null;
  raw_vendor_item_code: string | null;
  raw_label: string;
  raw_description: string | null;
  confirmed_description: string | null;
  vendor_id: string | null;
  product_id: string | null;
  vendor_product_id: string | null;
  vendor_product_source_key: string | null;
  quantity: number | string | null;
  confirmed_quantity: number | string | null;
  unit_price_cents: number | null;
  confirmed_unit_rate: number | string | null;
  confirmed_line_total_cents: number | null;
  billing_frequency: string | null;
  confirmed_billing_frequency: string | null;
  line_type: string | null;
  confirmed_line_type: string | null;
  review_status: string | null;
  review_severity: ReviewSeverity | null;
  extraction_confidence: number | string | null;
  identification_status: InvoiceLineIdentificationStatus | null;
};

export class InvoiceReviewError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly issues?: InvoiceReviewIssue[],
  ) {
    super(message);
  }
}

const invoiceColumns = `
  id, user_id, organization_id, document_upload_id, source_classification_revision, vendor, vendor_id, invoice_number, state, zip,
  review_status, review_version, reviewed_at,
  gross_charges_cents, credits_cents, past_balance_cents,
  late_fees_cents, taxes_cents, total_due_cents
`;

const lineColumns = `
  id, invoice_id, user_id, organization_id,
  vendor_item_code, raw_vendor_item_code, raw_label, raw_description,
  vendor_id, product_id, vendor_product_id, vendor_product_source_key,
  confirmed_description, quantity, confirmed_quantity,
  unit_price_cents, confirmed_unit_rate, confirmed_line_total_cents,
  billing_frequency, confirmed_billing_frequency,
  line_type, confirmed_line_type, review_status, review_severity,
  extraction_confidence, identification_status
`;

function numberOrNull(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function isLineType(value: string | null | undefined): value is InvoiceLineType {
  return !!value && (INVOICE_LINE_TYPES as readonly string[]).includes(value);
}

function annualCostCents(
  lineTotalCents: number | null,
  quantity: number | null,
  unitRate: number | null,
  frequency: string | null,
): number | null {
  const base = lineTotalCents ?? (quantity != null && unitRate != null ? Math.round(quantity * unitRate * 100) : null);
  if (base == null || !frequency) return null;
  const multiplier: Record<string, number> = {
    weekly: 52,
    "bi-weekly": 26,
    monthly: 12,
    quarterly: 4,
    annual: 1,
    "one-time": 1,
  };
  return multiplier[frequency] == null ? null : Math.round(base * multiplier[frequency]);
}

async function loadAuthorizedInvoice(invoiceId: string, userId: string): Promise<InvoiceRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invoice_analyses")
    .select(invoiceColumns)
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) throw new InvoiceReviewError(error.message, 503, "review_schema_unavailable");
  if (!data) throw new InvoiceReviewError("Invoice not found.", 404, "not_found");

  const invoice = data as unknown as InvoiceRow;
  if (invoice.user_id === userId) return invoice;
  if (!invoice.organization_id) throw new InvoiceReviewError("You do not have access to this invoice.", 403, "forbidden");

  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", invoice.organization_id)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) throw new InvoiceReviewError(membershipError.message, 503, "review_schema_unavailable");
  if (!membership) throw new InvoiceReviewError("You do not have access to this invoice.", 403, "forbidden");
  return invoice;
}

async function loadLines(invoiceId: string): Promise<LineRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invoice_line_items")
    .select(lineColumns)
    .eq("invoice_id", invoiceId)
    .neq("review_status", "excluded")
    .order("extracted_at", { ascending: true });
  if (error) throw new InvoiceReviewError(error.message, 503, "review_schema_unavailable");
  return (data ?? []) as unknown as LineRow[];
}

async function loadDocumentSegments(uploadId: string | null, revision: number | null): Promise<InvoiceDocumentSegment[]> {
  if (!uploadId) return [];
  const admin = createAdminClient();
  let query = admin
    .from("document_segments")
    .select("id,page_start,page_end,detected_type,confidence,reason,review_status,completeness_status,completeness_notes")
    .eq("upload_id", uploadId);
  if (revision != null) query = query.eq("classification_revision", revision);
  const { data, error } = await query.order("segment_index", { ascending: true });
  if (error) throw new InvoiceReviewError(error.message, 503, "review_schema_unavailable");
  return ((data ?? []) as unknown as SegmentRow[]).map(segment => ({
    id: segment.id,
    pageStart: segment.page_start,
    pageEnd: segment.page_end,
    documentType: segment.detected_type,
    confidence: numberOrNull(segment.confidence) ?? 0,
    reason: segment.reason,
    reviewStatus: segment.review_status,
    completenessStatus: segment.completeness_status,
    completenessNotes: segment.completeness_notes,
  }));
}

function lineFromRow(row: LineRow): InvoiceReviewLine {
  const possibleType = row.confirmed_line_type ?? row.line_type;
  return {
    id: row.id,
    vendorItemCode: row.raw_vendor_item_code ?? row.vendor_item_code,
    description: (row.confirmed_description ?? row.raw_label ?? "").trim(),
    quantity: numberOrNull(row.confirmed_quantity ?? row.quantity),
    unitRate: numberOrNull(row.confirmed_unit_rate) ?? (row.unit_price_cents == null ? null : row.unit_price_cents / 100),
    lineTotalCents: row.confirmed_line_total_cents,
    billingFrequency: row.confirmed_billing_frequency ?? row.billing_frequency,
    lineType: isLineType(possibleType) ? possibleType : "other",
    reviewStatus: row.review_status ?? "needs_review",
    reviewSeverity: row.review_severity ?? "yellow",
    extractionConfidence: numberOrNull(row.extraction_confidence),
    identificationStatus: row.identification_status ?? "unclassified",
    issues: [],
  };
}

function issue(
  severity: "yellow" | "red",
  code: string,
  message: string,
  lineItemId: string | null = null,
): InvoiceReviewIssue {
  return { severity, code, message, lineItemId };
}

function inspectReview(invoice: InvoiceRow, lines: InvoiceReviewLine[]): InvoiceReviewIssue[] {
  const issues: InvoiceReviewIssue[] = [];
  if (lines.length === 0) issues.push(issue("red", "NO_LINE_ITEMS", "No invoice lines were found. Add the missing lines before confirming."));

  for (const line of lines) {
    if (!line.description || line.description.toLowerCase() === "(unknown)") {
      issues.push(issue("red", "MISSING_DESCRIPTION", "This line needs a description.", line.id));
    }
    if (line.lineTotalCents == null) {
      issues.push(issue("red", "MISSING_LINE_TOTAL", "Enter the amount printed for this line.", line.id));
    }
    if (line.lineType === "charge") {
      const flatServiceFee = isFlatServiceFee(line.description);
      if (!line.billingFrequency) {
        issues.push(issue("red", "MISSING_FREQUENCY", "Choose how often this charge occurs so annual estimates are reliable.", line.id));
      }
      if (!flatServiceFee && line.quantity == null) issues.push(issue("yellow", "MISSING_QUANTITY", "Quantity was not found. Confirm that this is a flat charge or enter the quantity.", line.id));
      if (!flatServiceFee && line.unitRate == null) issues.push(issue("yellow", "MISSING_UNIT_RATE", "Unit rate was not found. Confirm that the printed line amount is correct.", line.id));
      if (!flatServiceFee && !line.vendorItemCode && line.identificationStatus !== "customer_unsure") {
        issues.push(issue("yellow", "MISSING_VENDOR_CODE", "No vendor item code was found, so product matching may need review.", line.id));
      }
    }
    if (line.extractionConfidence != null && line.extractionConfidence < 0.85) {
      issues.push(issue("yellow", "LOW_EXTRACTION_CONFIDENCE", `This row was read with ${Math.round(line.extractionConfidence * 100)}% confidence. Check it against the invoice.`, line.id));
    }
    if (line.quantity != null && line.unitRate != null && line.lineTotalCents != null) {
      const calculated = Math.round(line.quantity * line.unitRate * 100);
      if (Math.abs(calculated - line.lineTotalCents) > 1) {
        issues.push(issue("yellow", "LINE_MATH_DIFFERENCE", `Quantity × rate is off from the printed line amount by $${(Math.abs(calculated - line.lineTotalCents) / 100).toFixed(2)}.`, line.id));
      }
    }
  }

  if (invoice.total_due_cents == null) {
    issues.push(issue("red", "MISSING_TOTAL_DUE", "Enter the total due printed on the invoice."));
  }

  const gross = invoice.gross_charges_cents;
  const totalDue = invoice.total_due_cents;
  if (gross == null) {
    issues.push(issue("yellow", "MISSING_GROSS_CHARGES", "Current-period charges were not found. Confirm the line items carefully."));
  } else if (totalDue != null) {
    const headerTotal = gross
      - (invoice.credits_cents ?? 0)
      + (invoice.past_balance_cents ?? 0)
      + (invoice.late_fees_cents ?? 0)
      + (invoice.taxes_cents ?? 0);
    if (Math.abs(headerTotal - totalDue) > RECONCILIATION_TOLERANCE_CENTS) {
      issues.push(issue("red", "HEADER_TOTAL_MISMATCH", `The invoice totals are off by $${(Math.abs(headerTotal - totalDue) / 100).toFixed(2)}.`));
    }
  }

  if (totalDue != null && lines.length > 0 && lines.every(line => line.lineTotalCents != null)) {
    const lineTotal = lines.reduce((sum, line) => {
      const amount = line.lineTotalCents ?? 0;
      return sum + (line.lineType === "credit" || line.lineType === "discount" ? -amount : amount);
    }, 0);
    if (Math.abs(lineTotal - totalDue) > RECONCILIATION_TOLERANCE_CENTS) {
      issues.push(issue("red", "LINE_TOTAL_MISMATCH", `The reviewed lines are off from total due by $${(Math.abs(lineTotal - totalDue) / 100).toFixed(2)}. Add a missing line or correct an amount.`));
    }
  }

  return issues;
}

function inspectDocumentSegments(segments: InvoiceDocumentSegment[]): InvoiceReviewIssue[] {
  const issues: InvoiceReviewIssue[] = [];
  for (const segment of segments) {
    if (segment.documentType !== "invoice") continue;
    const pageLabel = segment.pageStart === segment.pageEnd
      ? `Page ${segment.pageStart}`
      : `Pages ${segment.pageStart}–${segment.pageEnd}`;
    if (segment.completenessStatus === "incomplete") {
      issues.push(issue(
        "red",
        `INCOMPLETE_INVOICE_PAGES_${segment.id}`,
        `${pageLabel} appears to be an incomplete invoice. ${segment.completenessNotes || "Upload the missing continuation page before confirming."}`,
      ));
    } else if (segment.completenessStatus === "possibly_incomplete") {
      issues.push(issue(
        "yellow",
        `POSSIBLY_INCOMPLETE_INVOICE_PAGES_${segment.id}`,
        `${pageLabel} may be missing a continuation page. ${segment.completenessNotes || "Check the original invoice before confirming."}`,
      ));
    }
  }
  return issues;
}

function makeDTO(invoice: InvoiceRow, rows: LineRow[], documentSegments: InvoiceDocumentSegment[] = []): InvoiceReviewDTO {
  const lines = orderInvoiceLinesForReview(rows.map(lineFromRow));
  const issues = [...inspectReview(invoice, lines), ...inspectDocumentSegments(documentSegments)];
  for (const line of lines) line.issues = issues.filter(item => item.lineItemId === line.id);

  const gross = invoice.gross_charges_cents;
  const computed = gross == null ? null : gross
    - (invoice.credits_cents ?? 0)
    + (invoice.past_balance_cents ?? 0)
    + (invoice.late_fees_cents ?? 0)
    + (invoice.taxes_cents ?? 0);
  const difference = computed == null || invoice.total_due_cents == null ? null : computed - invoice.total_due_cents;

  return {
    invoiceId: invoice.id,
    vendorName: invoice.vendor ?? "Unknown vendor",
    invoiceNumber: invoice.invoice_number ?? "—",
    status: invoice.review_status ?? "not_started",
    reviewVersion: invoice.review_version ?? 0,
    reviewedAt: invoice.reviewed_at,
    totals: {
      grossChargesCents: gross,
      creditsCents: invoice.credits_cents ?? 0,
      pastBalanceCents: invoice.past_balance_cents ?? 0,
      lateFeesCents: invoice.late_fees_cents ?? 0,
      taxesCents: invoice.taxes_cents ?? 0,
      totalDueCents: invoice.total_due_cents,
      computedTotalCents: computed,
      differenceCents: difference,
    },
    documentSegments,
    lines,
    issues,
    redIssueCount: issues.filter(item => item.severity === "red").length,
    yellowIssueCount: issues.filter(item => item.severity === "yellow").length,
  };
}

export async function getInvoiceReview(invoiceId: string, userId: string): Promise<InvoiceReviewDTO> {
  const invoice = await loadAuthorizedInvoice(invoiceId, userId);
  const [lines, documentSegments] = await Promise.all([
    loadLines(invoiceId),
    loadDocumentSegments(invoice.document_upload_id, invoice.source_classification_revision),
  ]);
  return makeDTO(invoice, lines, documentSegments);
}

function validateLineFields(fields: EditableInvoiceLineFields): void {
  if (fields.description !== undefined && (!fields.description.trim() || fields.description.length > 500)) {
    throw new InvoiceReviewError("Description is required and must be 500 characters or fewer.", 400, "invalid_description");
  }
  for (const [name, value] of [["quantity", fields.quantity], ["unit rate", fields.unitRate]] as const) {
    if (value !== undefined && value !== null && (!Number.isFinite(value) || value < 0 || value > 1_000_000_000)) {
      throw new InvoiceReviewError(`Invalid ${name}.`, 400, "invalid_number");
    }
  }
  if (fields.lineTotalCents !== undefined && fields.lineTotalCents !== null && (!Number.isSafeInteger(fields.lineTotalCents) || fields.lineTotalCents < 0 || fields.lineTotalCents > 1_000_000_000_000)) {
    throw new InvoiceReviewError("Invalid line amount.", 400, "invalid_money");
  }
  if (fields.billingFrequency !== undefined && fields.billingFrequency !== null && fields.billingFrequency.length > 50) {
    throw new InvoiceReviewError("Invalid billing frequency.", 400, "invalid_frequency");
  }
  if (fields.lineType !== undefined && !isLineType(fields.lineType)) {
    throw new InvoiceReviewError("Invalid line type.", 400, "invalid_line_type");
  }
  if (fields.identificationStatus !== undefined && !["matched", "unclassified", "customer_unsure", "pending_review"].includes(fields.identificationStatus)) {
    throw new InvoiceReviewError("Invalid identification status.", 400, "invalid_identification_status");
  }
}

async function refreshStoredReview(invoice: InvoiceRow, userId: string): Promise<InvoiceReviewDTO> {
  const admin = createAdminClient();
  const [rows, documentSegments] = await Promise.all([
    loadLines(invoice.id),
    loadDocumentSegments(invoice.document_upload_id, invoice.source_classification_revision),
  ]);
  const dto = makeDTO(invoice, rows, documentSegments);
  const now = new Date().toISOString();

  await admin
    .from("invoice_review_issues")
    .update({ status: "resolved", resolved_by: userId, resolved_at: now, updated_at: now })
    .eq("invoice_id", invoice.id)
    .eq("status", "open");

  if (dto.issues.length > 0) {
    const { error } = await admin.from("invoice_review_issues").insert(dto.issues.map(item => ({
      organization_id: invoice.organization_id ?? invoice.user_id,
      invoice_id: invoice.id,
      line_item_id: item.lineItemId,
      severity: item.severity,
      issue_code: item.code,
      message: item.message,
    })));
    if (error) throw new InvoiceReviewError(error.message, 503, "review_schema_unavailable");
  }

  for (const line of dto.lines) {
    const severity: ReviewSeverity = line.issues.some(item => item.severity === "red")
      ? "red"
      : line.issues.some(item => item.severity === "yellow") ? "yellow" : "none";
    await admin.from("invoice_line_items").update({ review_severity: severity }).eq("id", line.id);
  }

  return dto;
}

export async function saveInvoiceReviewLine(
  invoiceId: string,
  lineItemId: string,
  fields: EditableInvoiceLineFields,
  userId: string,
): Promise<InvoiceReviewDTO> {
  validateLineFields(fields);
  const invoice = await loadAuthorizedInvoice(invoiceId, userId);
  const admin = createAdminClient();
  const { data, error } = await admin.from("invoice_line_items").select(lineColumns).eq("id", lineItemId).eq("invoice_id", invoiceId).maybeSingle();
  if (error) throw new InvoiceReviewError(error.message, 503, "review_schema_unavailable");
  if (!data) throw new InvoiceReviewError("Invoice line not found.", 404, "line_not_found");
  const sourceRow = data as unknown as LineRow;
  const previous = lineFromRow(sourceRow);
  const nextDescription = fields.description?.trim();
  const descriptionChanged = nextDescription !== undefined && nextDescription !== previous.description;
  const customerUnsure = fields.identificationStatus === "customer_unsure";
  const mappingNeedsReview = descriptionChanged || customerUnsure;

  const update: Record<string, unknown> = {
    review_status: "customer_corrected",
    confirmed_by: userId,
    confirmed_at: new Date().toISOString(),
  };
  if (fields.description !== undefined) Object.assign(update, { confirmed_description: fields.description.trim() });
  if (fields.quantity !== undefined) Object.assign(update, { confirmed_quantity: fields.quantity, quantity: fields.quantity });
  if (fields.unitRate !== undefined) Object.assign(update, { confirmed_unit_rate: fields.unitRate, unit_price_cents: fields.unitRate == null ? null : Math.round(fields.unitRate * 100) });
  if (fields.lineTotalCents !== undefined) Object.assign(update, { confirmed_line_total_cents: fields.lineTotalCents });
  if (fields.billingFrequency !== undefined) Object.assign(update, { confirmed_billing_frequency: fields.billingFrequency, billing_frequency: fields.billingFrequency });
  if (fields.lineType !== undefined) Object.assign(update, { confirmed_line_type: fields.lineType, line_type: fields.lineType });
  if (fields.identificationStatus !== undefined) Object.assign(update, { identification_status: fields.identificationStatus });
  if (mappingNeedsReview) {
    Object.assign(update, {
      vendor_product_id: null,
      product_id: null,
      mapping_source: customerUnsure ? "customer_unsure" : "customer_pending_review",
      mapping_confidence: null,
      identification_status: customerUnsure ? "customer_unsure" : "pending_review",
    });
  }
  if (fields.quantity !== undefined || fields.unitRate !== undefined || fields.lineTotalCents !== undefined || fields.billingFrequency !== undefined) {
    Object.assign(update, {
      annual_cost_cents: annualCostCents(
        fields.lineTotalCents !== undefined ? fields.lineTotalCents : previous.lineTotalCents,
        fields.quantity !== undefined ? fields.quantity : previous.quantity,
        fields.unitRate !== undefined ? fields.unitRate : previous.unitRate,
        fields.billingFrequency !== undefined ? fields.billingFrequency : previous.billingFrequency,
      ),
    });
  }

  const { error: updateError } = await admin.from("invoice_line_items").update(update).eq("id", lineItemId).eq("invoice_id", invoiceId);
  if (updateError) throw new InvoiceReviewError(updateError.message, 503, "save_failed");

  const previousValues: Record<keyof EditableInvoiceLineFields, unknown> = {
    description: previous.description,
    quantity: previous.quantity,
    unitRate: previous.unitRate,
    lineTotalCents: previous.lineTotalCents,
    billingFrequency: previous.billingFrequency,
    lineType: previous.lineType,
    identificationStatus: previous.identificationStatus,
  };
  const corrections = Object.entries(fields).filter(([field, value]) => previousValues[field as keyof EditableInvoiceLineFields] !== value);
  if (corrections.length > 0) {
    await admin.from("invoice_line_item_corrections").insert(corrections.map(([field, value]) => ({
      organization_id: invoice.organization_id ?? invoice.user_id,
      invoice_id: invoiceId,
      line_item_id: lineItemId,
      field_name: field,
      previous_value: previousValues[field as keyof EditableInvoiceLineFields] ?? null,
      corrected_value: value ?? null,
      corrected_by: userId,
    })));
  }

  if (mappingNeedsReview) {
    const vendorId = sourceRow.vendor_id ?? invoice.vendor_id;
    if (vendorId) {
      const proposedData = {
        raw_description: sourceRow.raw_description ?? sourceRow.raw_label,
        confirmed_description: nextDescription ?? previous.description,
        vendor_item_code: sourceRow.raw_vendor_item_code ?? sourceRow.vendor_item_code,
        source_key: sourceRow.vendor_product_source_key,
        reason: customerUnsure ? "customer_unsure" : "description_corrected",
        previous_vendor_product_id: sourceRow.vendor_product_id,
      };
      const { data: pendingItem } = await admin
        .from("catalog_review_items")
        .select("id")
        .eq("invoice_line_item_id", lineItemId)
        .eq("status", "pending")
        .maybeSingle();
      if (pendingItem) {
        await admin.from("catalog_review_items").update({
          review_type: sourceRow.vendor_product_id ? "mapping_correction" : "new_product",
          proposed_data: proposedData,
          submitted_by: userId,
        }).eq("id", pendingItem.id);
      } else {
        await admin.from("catalog_review_items").insert({
          organization_id: invoice.organization_id ?? invoice.user_id,
          vendor_id: vendorId,
          invoice_line_item_id: lineItemId,
          review_type: sourceRow.vendor_product_id ? "mapping_correction" : "new_product",
          proposed_data: proposedData,
          status: "pending",
          submitted_by: userId,
        });
      }
    }
  }

  await admin.from("invoice_analyses").update({ review_status: "needs_review", review_version: (invoice.review_version ?? 0) + 1 }).eq("id", invoiceId);
  const refreshedInvoice = { ...invoice, review_status: "needs_review" as const, review_version: (invoice.review_version ?? 0) + 1 };
  return refreshStoredReview(refreshedInvoice, userId);
}

export async function addInvoiceReviewLine(
  invoiceId: string,
  fields: EditableInvoiceLineFields,
  userId: string,
): Promise<InvoiceReviewDTO> {
  validateLineFields(fields);
  const invoice = await loadAuthorizedInvoice(invoiceId, userId);
  const admin = createAdminClient();
  const description = fields.description?.trim();
  if (!description) throw new InvoiceReviewError("Description is required.", 400, "invalid_description");
  const lineType = fields.lineType ?? "charge";
  const unitRate = fields.unitRate ?? null;
  const lineTotal = fields.lineTotalCents ?? null;
  const frequency = fields.billingFrequency ?? null;
  const { data: insertedLine, error } = await admin.from("invoice_line_items").insert({
    invoice_id: invoiceId,
    user_id: invoice.user_id,
    organization_id: invoice.organization_id ?? invoice.user_id,
    raw_label: description,
    line_type: lineType,
    vendor_id: invoice.vendor_id,
    quantity: fields.quantity ?? null,
    unit_price_cents: unitRate == null ? null : Math.round(unitRate * 100),
    billing_frequency: frequency,
    annual_cost_cents: annualCostCents(lineTotal, fields.quantity ?? null, unitRate, frequency),
    state: invoice.state,
    zip: invoice.zip,
    raw_description: description,
    raw_quantity: fields.quantity ?? null,
    raw_unit_rate: unitRate,
    raw_line_total_cents: lineTotal,
    raw_billing_frequency: frequency,
    confirmed_description: description,
    confirmed_quantity: fields.quantity ?? null,
    confirmed_unit_rate: unitRate,
    confirmed_line_total_cents: lineTotal,
    confirmed_billing_frequency: frequency,
    confirmed_line_type: lineType,
    identification_status: fields.identificationStatus ?? "unclassified",
    mapping_source: fields.identificationStatus === "customer_unsure" ? "customer_unsure" : "customer_added",
    review_status: "customer_corrected",
    review_severity: "yellow",
    confirmed_by: userId,
    confirmed_at: new Date().toISOString(),
  }).select("id").single();
  if (error) throw new InvoiceReviewError(error.message, 503, "save_failed");
  if (invoice.vendor_id && insertedLine) {
    await admin.from("catalog_review_items").insert({
      organization_id: invoice.organization_id ?? invoice.user_id,
      vendor_id: invoice.vendor_id,
      invoice_line_item_id: insertedLine.id,
      review_type: "new_product",
      proposed_data: {
        confirmed_description: description,
        reason: fields.identificationStatus === "customer_unsure" ? "customer_unsure" : "customer_added_line",
      },
      status: "pending",
      submitted_by: userId,
    });
  }
  await admin.from("invoice_analyses").update({ review_status: "needs_review", review_version: (invoice.review_version ?? 0) + 1 }).eq("id", invoiceId);
  return refreshStoredReview({ ...invoice, review_status: "needs_review", review_version: (invoice.review_version ?? 0) + 1 }, userId);
}

export async function excludeInvoiceReviewLine(invoiceId: string, lineItemId: string, userId: string): Promise<InvoiceReviewDTO> {
  const invoice = await loadAuthorizedInvoice(invoiceId, userId);
  const admin = createAdminClient();
  const { data, error } = await admin.from("invoice_line_items").update({ review_status: "excluded", confirmed_by: userId, confirmed_at: new Date().toISOString() }).eq("id", lineItemId).eq("invoice_id", invoiceId).select("id").maybeSingle();
  if (error) throw new InvoiceReviewError(error.message, 503, "save_failed");
  if (!data) throw new InvoiceReviewError("Invoice line not found.", 404, "line_not_found");
  await admin.from("invoice_analyses").update({ review_status: "needs_review", review_version: (invoice.review_version ?? 0) + 1 }).eq("id", invoiceId);
  return refreshStoredReview({ ...invoice, review_status: "needs_review", review_version: (invoice.review_version ?? 0) + 1 }, userId);
}

export async function saveInvoiceReviewTotals(invoiceId: string, fields: EditableInvoiceTotalFields, userId: string): Promise<InvoiceReviewDTO> {
  const invoice = await loadAuthorizedInvoice(invoiceId, userId);
  const values = Object.values(fields);
  if (values.some(value => value !== undefined && value !== null && (!Number.isSafeInteger(value) || Math.abs(value) > 1_000_000_000_000))) {
    throw new InvoiceReviewError("Invoice totals must be whole cents.", 400, "invalid_money");
  }
  const update = {
    ...(fields.grossChargesCents !== undefined && { gross_charges_cents: fields.grossChargesCents }),
    ...(fields.creditsCents !== undefined && { credits_cents: fields.creditsCents }),
    ...(fields.pastBalanceCents !== undefined && { past_balance_cents: fields.pastBalanceCents }),
    ...(fields.lateFeesCents !== undefined && { late_fees_cents: fields.lateFeesCents }),
    ...(fields.taxesCents !== undefined && { taxes_cents: fields.taxesCents }),
    ...(fields.totalDueCents !== undefined && { total_due_cents: fields.totalDueCents }),
    review_status: "needs_review",
    review_version: (invoice.review_version ?? 0) + 1,
  };
  const admin = createAdminClient();
  const { error } = await admin.from("invoice_analyses").update(update).eq("id", invoiceId);
  if (error) throw new InvoiceReviewError(error.message, 503, "save_failed");
  return getInvoiceReview(invoiceId, userId);
}

export async function confirmInvoiceReview(invoiceId: string, userId: string): Promise<InvoiceReviewDTO> {
  const invoice = await loadAuthorizedInvoice(invoiceId, userId);
  const dto = await refreshStoredReview(invoice, userId);
  if (dto.redIssueCount > 0) {
    throw new InvoiceReviewError("Resolve every red issue before confirming the invoice.", 409, "red_issues_remaining", dto.issues.filter(item => item.severity === "red"));
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: linesError } = await admin.from("invoice_line_items").update({ review_status: "confirmed", review_severity: "none", confirmed_by: userId, confirmed_at: now }).eq("invoice_id", invoiceId).neq("review_status", "excluded");
  if (linesError) throw new InvoiceReviewError(linesError.message, 503, "save_failed");
  await admin.from("invoice_review_issues").update({ status: "resolved", resolved_by: userId, resolved_at: now, updated_at: now }).eq("invoice_id", invoiceId).eq("status", "open");

  const computed = dto.totals.computedTotalCents;
  const difference = dto.totals.differenceCents;
  const { error } = await admin.from("invoice_analyses").update({
    review_status: "confirmed",
    reviewed_by: userId,
    reviewed_at: now,
    analysis_ready_at: now,
    review_version: (invoice.review_version ?? 0) + 1,
    extracted_total_check_cents: computed,
    reconciliation_difference_cents: difference,
    totals_reconciled: difference != null && Math.abs(difference) <= RECONCILIATION_TOLERANCE_CENTS,
  }).eq("id", invoiceId);
  if (error) throw new InvoiceReviewError(error.message, 503, "save_failed");
  return getInvoiceReview(invoiceId, userId);
}

export async function reopenInvoiceReview(invoiceId: string, userId: string): Promise<InvoiceReviewDTO> {
  const invoice = await loadAuthorizedInvoice(invoiceId, userId);
  const admin = createAdminClient();
  const { error } = await admin.from("invoice_analyses").update({
    review_status: "reopened",
    analysis_ready_at: null,
    review_version: (invoice.review_version ?? 0) + 1,
  }).eq("id", invoiceId);
  if (error) throw new InvoiceReviewError(error.message, 503, "save_failed");
  return getInvoiceReview(invoiceId, userId);
}

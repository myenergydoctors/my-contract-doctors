export const DOCUMENT_TYPES = [
  "invoice",
  "agreement",
  "mixed",
  "statement",
  "purchase-order",
  "receipt",
  "other",
] as const;

export const SEGMENT_DOCUMENT_TYPES = DOCUMENT_TYPES.filter(type => type !== "mixed");

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type SegmentDocumentType = (typeof SEGMENT_DOCUMENT_TYPES)[number];
export type DocumentQuality = "high" | "medium" | "low" | "unreadable";

export type DocumentSegment = {
  page_start: number;
  page_end: number;
  document_type: SegmentDocumentType;
  confidence: number;
  reason?: string;
  vendor_name?: string | null;
  document_number?: string | null;
  document_date?: string | null;
  completeness_status?: "complete" | "possibly_incomplete" | "incomplete";
  completeness_notes?: string | null;
};

export type DocumentClassification = {
  document_type: DocumentType;
  document_type_reason?: string;
  document_type_confidence: number;
  page_count: number;
  document_quality?: DocumentQuality;
  document_quality_notes?: string | null;
  document_segments: DocumentSegment[];
};

const typeSet = new Set<string>(DOCUMENT_TYPES);
const segmentTypeSet = new Set<string>(SEGMENT_DOCUMENT_TYPES);
const qualitySet = new Set<string>(["high", "medium", "low", "unreadable"]);
const completenessSet = new Set<string>(["complete", "possibly_incomplete", "incomplete"]);

function isFiniteConfidence(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validateDocumentClassification(value: unknown): asserts value is DocumentClassification {
  if (!value || typeof value !== "object") throw new Error("Document classification is not an object.");
  const result = value as Partial<DocumentClassification>;

  if (typeof result.document_type !== "string" || !typeSet.has(result.document_type)) {
    throw new Error("Document classification has an invalid document type.");
  }
  if (!isFiniteConfidence(result.document_type_confidence)) {
    throw new Error("Document classification has invalid type confidence.");
  }
  if (!Number.isSafeInteger(result.page_count) || (result.page_count ?? 0) < 1 || (result.page_count ?? 0) > 10_000) {
    throw new Error("Document classification has an invalid page count.");
  }
  if (result.document_quality !== undefined && !qualitySet.has(result.document_quality)) {
    throw new Error("Document classification has an invalid quality value.");
  }
  if (!Array.isArray(result.document_segments) || result.document_segments.length < 1 || result.document_segments.length > 100) {
    throw new Error("Document classification has an invalid segment count.");
  }

  let previousPageEnd = 0;
  const detectedTypes = new Set<string>();
  for (const segment of result.document_segments) {
    if (!segment || typeof segment !== "object") throw new Error("Document classification contains an invalid segment.");
    if (!Number.isSafeInteger(segment.page_start) || !Number.isSafeInteger(segment.page_end)) {
      throw new Error("Document classification contains an invalid page range.");
    }
    if (segment.page_start < 1 || segment.page_end < segment.page_start || segment.page_end > result.page_count) {
      throw new Error("Document classification contains an out-of-range segment.");
    }
    if (segment.page_start <= previousPageEnd) {
      throw new Error("Document classification segments overlap or are out of order.");
    }
    if (typeof segment.document_type !== "string" || !segmentTypeSet.has(segment.document_type)) {
      throw new Error("Document classification contains an invalid segment type.");
    }
    if (!isFiniteConfidence(segment.confidence)) {
      throw new Error("Document classification contains invalid segment confidence.");
    }
    if (segment.completeness_status !== undefined && !completenessSet.has(segment.completeness_status)) {
      throw new Error("Document classification contains an invalid completeness status.");
    }
    previousPageEnd = segment.page_end;
    detectedTypes.add(segment.document_type);
  }

  if (result.document_type === "mixed" && detectedTypes.size < 2) {
    throw new Error("A mixed document must contain at least two document types.");
  }
  if (result.document_type !== "mixed" && detectedTypes.size !== 1) {
    throw new Error("A single-type document cannot contain different segment types.");
  }
  if (result.document_type !== "mixed" && !detectedTypes.has(result.document_type)) {
    throw new Error("The overall document type does not match its segments.");
  }
}

export function normalizeDocumentClassification(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.document_segments) || candidate.document_segments.length === 0) return value;
  const segmentTypes = new Set(
    candidate.document_segments
      .map(segment => segment && typeof segment === "object" ? (segment as Record<string, unknown>).document_type : null)
      .filter((type): type is string => typeof type === "string" && segmentTypeSet.has(type))
  );
  if (segmentTypes.size === 0) return value;
  return {
    ...candidate,
    document_type: segmentTypes.size > 1 ? "mixed" : [...segmentTypes][0],
  };
}

export function findSegmentForPageRange(
  segments: DocumentSegment[],
  pageStart: number | undefined,
  pageEnd: number | undefined,
): number | null {
  if (!pageStart || !pageEnd) return null;
  const index = segments.findIndex(segment =>
    segment.document_type === "invoice" &&
    pageStart >= segment.page_start &&
    pageEnd <= segment.page_end
  );
  return index >= 0 ? index : null;
}

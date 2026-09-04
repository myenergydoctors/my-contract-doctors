import assert from "node:assert/strict";
import test from "node:test";

import {
  findSegmentForPageRange,
  normalizeDocumentClassification,
  validateDocumentClassification,
  type DocumentClassification,
// Node's built-in type-stripping test runner requires the explicit extension.
// @ts-expect-error TypeScript's noEmit project mode otherwise rejects it.
} from "../lib/document-classification.ts";

test("accepts a pure agreement bundle", () => {
  const classification: DocumentClassification = {
    document_type: "agreement",
    document_type_confidence: 0.99,
    page_count: 3,
    document_quality: "medium",
    document_segments: [{
      page_start: 1,
      page_end: 3,
      document_type: "agreement",
      confidence: 0.99,
    }],
  };
  assert.doesNotThrow(() => validateDocumentClassification(classification));
});

test("accepts a valid missing-page completeness warning", () => {
  const classification: DocumentClassification = {
    document_type: "invoice",
    document_type_confidence: 0.98,
    page_count: 1,
    document_segments: [{
      page_start: 1,
      page_end: 1,
      document_type: "invoice",
      confidence: 0.98,
      completeness_status: "incomplete",
      completeness_notes: "Printed Page 1 of 2; page 2 is absent.",
    }],
  };
  assert.doesNotThrow(() => validateDocumentClassification(classification));
});

test("rejects an unknown completeness status", () => {
  const classification = {
    document_type: "invoice",
    document_type_confidence: 0.98,
    page_count: 1,
    document_segments: [{
      page_start: 1,
      page_end: 1,
      document_type: "invoice",
      confidence: 0.98,
      completeness_status: "probably",
    }],
  };
  assert.throws(() => validateDocumentClassification(classification), /completeness/i);
});

test("accepts an agreement followed by an invoice in the same PDF", () => {
  const classification: DocumentClassification = {
    document_type: "mixed",
    document_type_confidence: 0.97,
    page_count: 8,
    document_quality: "low",
    document_segments: [
      { page_start: 1, page_end: 6, document_type: "agreement", confidence: 0.98 },
      { page_start: 7, page_end: 8, document_type: "invoice", confidence: 0.96 },
    ],
  };
  assert.doesNotThrow(() => validateDocumentClassification(classification));
  assert.equal(findSegmentForPageRange(classification.document_segments, 7, 8), 1);
});

test("accepts two invoices as one overall invoice upload", () => {
  const classification: DocumentClassification = {
    document_type: "invoice",
    document_type_confidence: 0.99,
    page_count: 4,
    document_segments: [
      { page_start: 1, page_end: 2, document_type: "invoice", confidence: 0.99 },
      { page_start: 3, page_end: 4, document_type: "invoice", confidence: 0.99 },
    ],
  };
  assert.doesNotThrow(() => validateDocumentClassification(classification));
});

test("rejects overlapping page ranges", () => {
  const classification = {
    document_type: "mixed",
    document_type_confidence: 0.9,
    page_count: 5,
    document_segments: [
      { page_start: 1, page_end: 3, document_type: "agreement", confidence: 0.9 },
      { page_start: 3, page_end: 5, document_type: "invoice", confidence: 0.9 },
    ],
  };
  assert.throws(() => validateDocumentClassification(classification), /overlap/i);
});

test("rejects mixed when all segments have the same type", () => {
  const classification = {
    document_type: "mixed",
    document_type_confidence: 0.9,
    page_count: 4,
    document_segments: [
      { page_start: 1, page_end: 2, document_type: "invoice", confidence: 0.9 },
      { page_start: 3, page_end: 4, document_type: "invoice", confidence: 0.9 },
    ],
  };
  assert.throws(() => validateDocumentClassification(classification), /at least two/i);
});

test("normalizes a contradictory overall type from authoritative page segments", () => {
  const raw = {
    document_type: "mixed",
    document_type_confidence: 0.99,
    page_count: 4,
    document_segments: [
      { page_start: 1, page_end: 1, document_type: "invoice", confidence: 0.99 },
      { page_start: 2, page_end: 2, document_type: "invoice", confidence: 0.99 },
      { page_start: 3, page_end: 4, document_type: "invoice", confidence: 0.99 },
    ],
  };
  const normalized = normalizeDocumentClassification(raw);
  validateDocumentClassification(normalized);
  assert.equal((normalized as DocumentClassification).document_type, "invoice");
});

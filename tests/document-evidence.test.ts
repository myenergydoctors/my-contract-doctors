import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node test runner uses explicit TypeScript extensions.
import { quoteIsOnPage, validAgreementDate } from "../lib/agreement-evidence.ts";
// @ts-expect-error Node test runner uses explicit TypeScript extensions.
import { validateInvoicePageCoverage } from "../lib/invoice-page-coverage.ts";

test("quote verification preserves words, amounts, negations, and page references", () => {
  const pages = ['No minimum\n billing applies. A fee of $200.00 applies unless waived.', 'Renewal requires written consent.'];
  assert.equal(quoteIsOnPage('No minimum billing applies.', 1, pages), true);
  assert.equal(quoteIsOnPage('Minimum billing applies.', 1, pages), false);
  assert.equal(quoteIsOnPage('minimum billing applies.', 1, pages), false);
  assert.equal(quoteIsOnPage('A fee of $20.00 applies', 1, pages), false);
  assert.equal(quoteIsOnPage('Renewal requires written consent.', 1, pages), false);
  assert.equal(quoteIsOnPage('Renewal requires written consent.', 2, pages), true);
  assert.equal(quoteIsOnPage('invented OCR', 1, ['']), false);
});
test("rejects impossible dates rather than rolling deadlines into another month", () => {
  assert.equal(validAgreementDate('2027-02-29'), null);
  assert.equal(validAgreementDate('2028-02-29'), '2028-02-29');
  assert.equal(validAgreementDate('2027-13-01'), null);
});
const extraction = {
  page_count: 2,
  document_segments: [{ page_start: 1, page_end: 1, document_type: 'invoice' }, { page_start: 2, page_end: 2, document_type: 'invoice' }],
  invoices: [{ source_page_start: 1, source_page_end: 1, line_items: [{ source_page: 1 }] }, { source_page_start: 2, source_page_end: 2, line_items: [{ source_page: 2 }] }],
};
test("requires every physical invoice page, segment, and line source to agree", () => {
  assert.doesNotThrow(() => validateInvoicePageCoverage(extraction, 2));
  assert.throws(() => validateInvoicePageCoverage(extraction, 3), /physical/);
  assert.throws(() => validateInvoicePageCoverage({ ...extraction, invoices: extraction.invoices.slice(0,1) }, 2), /missing/);
  assert.throws(() => validateInvoicePageCoverage({ ...extraction, invoices: [extraction.invoices[0], extraction.invoices[0]] }, 2), /overlap/);
  assert.throws(() => validateInvoicePageCoverage({ ...extraction, invoices: [{...extraction.invoices[0], line_items: [{ source_page: 2 }]}, extraction.invoices[1]] }, 2), /outside/);
  assert.throws(() => validateInvoicePageCoverage({ ...extraction, invoices: [{...extraction.invoices[0], line_items: []}, extraction.invoices[1]] }, 2), /no extracted/);
});

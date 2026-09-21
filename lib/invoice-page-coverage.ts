type InvoiceCoverage = {
  page_count: number;
  document_segments: { page_start: number; page_end: number; document_type: string }[];
  invoices?: {
    source_page_start?: number | null;
    source_page_end?: number | null;
    line_items?: { source_page?: number | null }[];
  }[];
};

/** Check physical pages independently of the model's internally consistent JSON. */
export function validateInvoicePageCoverage(result: InvoiceCoverage, physicalPageCount: number): void {
  if (result.page_count !== physicalPageCount) throw new Error("The extraction did not cover the physical document pages.");
  const expected = new Set<number>();
  for (const segment of result.document_segments) {
    if (segment.document_type === "invoice") {
      for (let page = segment.page_start; page <= segment.page_end; page++) expected.add(page);
    }
  }
  const covered = new Set<number>();
  for (const invoice of result.invoices ?? []) {
    const start = invoice.source_page_start;
    const end = invoice.source_page_end;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > physicalPageCount) throw new Error("Invalid invoice page range.");
    for (let page = start; page <= end; page++) {
      if (!expected.has(page) || covered.has(page)) throw new Error("Invoice page ranges overlap or include a different document.");
      covered.add(page);
    }
    if (!invoice.line_items?.length) throw new Error("An invoice has no extracted lines.");
    for (const line of invoice.line_items) {
      if (line.source_page != null && (!Number.isInteger(line.source_page) || line.source_page < start || line.source_page > end)) throw new Error("Invoice line source page is outside its invoice.");
    }
  }
  if (expected.size !== covered.size) throw new Error("An invoice segment is missing from the extraction.");
}

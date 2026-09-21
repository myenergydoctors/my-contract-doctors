export function normalizeSourceText(value: string): string {
  return value.normalize("NFKC").replace(/\u00ad/g, "").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
}

export function quoteIsOnPage(quote: string, sourcePage: number | null, pages: string[]): boolean {
  if (!Number.isInteger(sourcePage) || sourcePage < 1 || sourcePage > pages.length) return false;
  const needle = normalizeSourceText(quote);
  if (!needle) return false;
  const page = normalizeSourceText(pages[sourcePage - 1]);
  let start = page.indexOf(needle);
  while (start !== -1) {
    const before = page.slice(0, start);
    // An exact substring is insufficient if its leading negation was dropped.
    if (!/\b(?:no|not|never|without|unless|except)\s+$/i.test(before)) return true;
    start = page.indexOf(needle, start + 1);
  }
  return false;
}

export function validAgreementDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

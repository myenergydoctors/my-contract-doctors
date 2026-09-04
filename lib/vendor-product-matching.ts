type VendorSlugLookup = ReadonlyMap<string, string>;

type MatchableVendorProduct = {
  id: string;
  vendor_id: string;
  vendor_item_code: string | null;
  display_name: string | null;
  catalog_status: "candidate" | "approved" | "rejected";
};

export function normalizeItemCode(code: string): string {
  return code.trim().toUpperCase();
}

export function normalizeVendorDescription(description: string): string {
  return description
    .toUpperCase()
    .replace(/\s*\([0-9]{1,10}\)\s*$/, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function compactItemCode(code: string): string {
  return normalizeItemCode(code).replace(/\s+/g, "");
}

export function canonicalVendorItemCode(code: string, vendorSlug?: string | null): string {
  const normalized = compactItemCode(code);
  if (vendorSlug === "cintas") return normalized.replace(/^X(?=\d+$)/, "");
  return normalized;
}

function descriptionTokens(description: string): Set<string> {
  return new Set(normalizeVendorDescription(description).split(" ").filter(token => token.length > 1));
}

function similarity(left: string, right: string): number {
  const a = descriptionTokens(left);
  const b = descriptionTokens(right);
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / new Set([...a, ...b]).size;
}

export function findApprovedVendorProduct<T extends MatchableVendorProduct>(
  catalog: readonly T[],
  vendorSlugById: VendorSlugLookup,
  vendorId: string,
  itemCode: string | null,
  description: string,
): T | null {
  const vendorRows = catalog.filter(row => row.vendor_id === vendorId && row.catalog_status === "approved");
  const normalizedDescription = normalizeVendorDescription(description);

  if (!itemCode) {
    const exactDescription = vendorRows.filter(row => normalizeVendorDescription(row.display_name || "") === normalizedDescription);
    return exactDescription.length === 1 ? exactDescription[0] : null;
  }

  const vendorSlug = vendorSlugById.get(vendorId);
  const canonicalCode = canonicalVendorItemCode(itemCode, vendorSlug);
  const codeMatches = vendorRows.filter(row => row.vendor_item_code && canonicalVendorItemCode(row.vendor_item_code, vendorSlug) === canonicalCode);
  if (codeMatches.length === 1) return codeMatches[0];
  if (codeMatches.length === 0) return null;

  const exactDescription = codeMatches.filter(row => normalizeVendorDescription(row.display_name || "") === normalizedDescription);
  if (exactDescription.length === 1) return exactDescription[0];

  const scored = codeMatches
    .map(row => ({ row, score: similarity(description, row.display_name || "") }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  const runnerUp = scored[1];
  return best && best.score >= 0.72 && (!runnerUp || best.score - runnerUp.score >= 0.15) ? best.row : null;
}

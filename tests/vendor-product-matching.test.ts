import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's type-stripping runner requires the explicit extension.
import { canonicalVendorItemCode, findApprovedVendorProduct } from "../lib/vendor-product-matching.ts";
import type { VendorProduct } from "../lib/db/vendor-products";

const vendorSlugs = new Map([["cintas-id", "cintas"]]);

function product(overrides: Partial<VendorProduct> & Pick<VendorProduct, "id" | "vendor_item_code" | "display_name">): VendorProduct {
  return {
    id: overrides.id,
    vendor_id: overrides.vendor_id || "cintas-id",
    vendor_item_code: overrides.vendor_item_code,
    display_name: overrides.display_name,
    source_key: overrides.source_key || `${overrides.vendor_item_code}::${overrides.display_name}`,
    product_id: overrides.product_id || null,
    mapping_source: overrides.mapping_source || "seed",
    catalog_status: overrides.catalog_status || "approved",
    times_seen: overrides.times_seen || 0,
    notes: overrides.notes || null,
  };
}

test("Cintas invoice X prefixes match numeric workbook codes", () => {
  assert.equal(canonicalVendorItemCode("X10197", "cintas"), "10197");
  const match = findApprovedVendorProduct(
    [product({ id: "mat", vendor_item_code: "10197", display_name: "4X6 TRAFFIC MAT" })],
    vendorSlugs,
    "cintas-id",
    "X10197",
    "Traffic mat 4 x 6",
  );
  assert.equal(match?.id, "mat");
});

test("a unique approved vendor code wins despite invoice wording", () => {
  const match = findApprovedVendorProduct(
    [product({ id: "jacket", vendor_item_code: "376", display_name: "CARHARTT ACTIVE JACKET" })],
    vendorSlugs,
    "cintas-id",
    "X376",
    "Carhartt jacket - weekly service",
  );
  assert.equal(match?.id, "jacket");
});

test("duplicate codes use an exact normalized description", () => {
  const rows = [
    product({ id: "old", vendor_item_code: "10147", display_name: "MENS HIVIS RFLCTIVE BMBER JCKT" }),
    product({ id: "new", vendor_item_code: "X10147", display_name: "BOMBER JACKET/FR/REFL" }),
  ];
  assert.equal(findApprovedVendorProduct(rows, vendorSlugs, "cintas-id", "X10147", "Bomber Jacket FR Refl")?.id, "new");
});

test("ambiguous duplicate codes are not silently matched", () => {
  const rows = [
    product({ id: "a", vendor_item_code: "55", display_name: "RED SHIRT LARGE" }),
    product({ id: "b", vendor_item_code: "X55", display_name: "BLUE SHIRT LARGE" }),
  ];
  assert.equal(findApprovedVendorProduct(rows, vendorSlugs, "cintas-id", "X55", "SHIRT LARGE"), null);
});

test("no-code rows require one exact description", () => {
  const row = product({ id: "fee", vendor_item_code: null, display_name: "SERVICE CHARGE" });
  assert.equal(findApprovedVendorProduct([row], vendorSlugs, "cintas-id", null, "Service charge")?.id, "fee");
  assert.equal(findApprovedVendorProduct([row], vendorSlugs, "cintas-id", null, "General fee"), null);
});

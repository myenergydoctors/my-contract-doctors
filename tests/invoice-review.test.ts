import assert from "node:assert/strict";
import test from "node:test";

// Node's built-in type-stripping test runner requires the explicit extension.
// @ts-expect-error TypeScript's noEmit project mode otherwise rejects it.
import { isFlatServiceFee, orderInvoiceLinesForReview } from "../lib/invoice-review.ts";

test("recognizes vendor service charges as flat fees", () => {
  assert.equal(isFlatServiceFee("SERVICE CHARGE"), true);
  assert.equal(isFlatServiceFee("Facility Service Fee"), true);
  assert.equal(isFlatServiceFee("Route Service Charge"), true);
});

test("does not treat ordinary services or products as flat service fees", () => {
  assert.equal(isFlatServiceFee("MOP SERVICE"), false);
  assert.equal(isFlatServiceFee("3X5 ACTIVE SCRAPER"), false);
});

test("shows products first and flat service fees last without changing product order", () => {
  const lines = [
    { description: "SERVICE CHARGE", id: "fee" },
    { description: "3X5 ACTIVE SCRAPER", id: "mat" },
    { description: "MOP SERVICE", id: "mop" },
  ];
  assert.deepEqual(orderInvoiceLinesForReview(lines).map(line => line.id), ["mat", "mop", "fee"]);
  assert.deepEqual(lines.map(line => line.id), ["fee", "mat", "mop"]);
});

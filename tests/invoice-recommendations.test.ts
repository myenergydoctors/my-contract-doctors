import assert from "node:assert/strict";
import test from "node:test";

// Node's built-in type-stripping test runner requires the explicit extension.
// @ts-expect-error TypeScript's noEmit project mode otherwise rejects it.
import { buildInvoiceFindings, selectFreeInvoiceFinding, selectFreeSavingsRecommendation } from "../lib/invoice-recommendations.ts";

const baseLine = {
  id: "mat-1",
  description: "3X5 ACTIVE SCRAPER",
  lineType: "charge",
  productSlug: null,
  productName: null,
  productCategory: null,
  quantity: 2,
  unitPriceCents: 1_000,
  lineTotalCents: 2_000,
  billingFrequency: "weekly",
  identificationStatus: "matched" as const,
};

test("calculates a transparent weekly mat buy-versus-rent estimate", () => {
  const recommendation = selectFreeSavingsRecommendation([baseLine]);

  assert.ok(recommendation);
  assert.equal(recommendation.annualRentalCostCents, 104_000);
  assert.equal(recommendation.purchaseCostCents, 15_000);
  assert.equal(recommendation.firstYearSavingsCents, 89_000);
  assert.equal(recommendation.laterYearSavingsCents, 104_000);
  assert.equal(recommendation.paybackWeeks, 8);
});

test("selects only the highest first-year mat opportunity", () => {
  const recommendation = selectFreeSavingsRecommendation([
    baseLine,
    { ...baseLine, id: "mat-2", description: "4X6 FLOOR MAT", lineTotalCents: 4_000 },
  ]);

  assert.equal(recommendation?.lineItemId, "mat-2");
});

test("does not mistake a service charge for a purchasable product", () => {
  const recommendation = selectFreeSavingsRecommendation([
    { ...baseLine, description: "SERVICE CHARGE", productSlug: null, lineTotalCents: 5_000 },
  ]);

  assert.equal(recommendation, null);
});

test("does not use an unidentified or customer-uncertain line for product savings", () => {
  assert.equal(selectFreeSavingsRecommendation([{ ...baseLine, identificationStatus: "unclassified" }]), null);
  assert.equal(selectFreeSavingsRecommendation([{ ...baseLine, identificationStatus: "customer_unsure" }]), null);
  assert.equal(selectFreeSavingsRecommendation([{ ...baseLine, identificationStatus: "pending_review" }]), null);
});

test("does not estimate savings when confirmed math is incomplete", () => {
  assert.equal(selectFreeSavingsRecommendation([{ ...baseLine, quantity: null }]), null);
  assert.equal(selectFreeSavingsRecommendation([{ ...baseLine, billingFrequency: null }]), null);
  assert.equal(selectFreeSavingsRecommendation([{ ...baseLine, lineTotalCents: null, unitPriceCents: null }]), null);
});

test("does not recommend buying when the first-year total would cost more", () => {
  const recommendation = selectFreeSavingsRecommendation([
    { ...baseLine, quantity: 10, lineTotalCents: 5_000, billingFrequency: "annual" },
  ]);

  assert.equal(recommendation, null);
});

test("keeps the floor-mat opportunity first and counts other supported review areas", () => {
  const findings = buildInvoiceFindings([
    baseLine,
    { ...baseLine, id: "fee-1", description: "Environmental service fee", productName: null, productCategory: null, productSlug: null, quantity: 1, unitPriceCents: 1200, lineTotalCents: 1200 },
    { ...baseLine, id: "late-1", description: "Late fee", lineType: "late_fee", productName: null, productCategory: null, productSlug: null, quantity: 1, unitPriceCents: 2500, lineTotalCents: 2500 },
  ]);
  assert.equal(findings.length, 3);
  assert.equal(selectFreeInvoiceFinding(findings)?.kind, "floor_mat_purchase");
  assert.deepEqual(findings.map(finding => finding.kind), ["floor_mat_purchase", "late_fee", "service_fee"]);
});

test("uses the largest confirmed recurring charge as the stable free fallback", () => {
  const findings = buildInvoiceFindings([
    { ...baseLine, id: "uniform-1", description: "Uniform rental", productName: "Uniform rental", productCategory: "uniforms", quantity: 10, unitPriceCents: 900, lineTotalCents: 9000 },
    { ...baseLine, id: "towel-1", description: "Towel service", productName: "Towel service", productCategory: "towels", quantity: 5, unitPriceCents: 500, lineTotalCents: 2500 },
  ]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, "largest_recurring_charge");
  assert.equal(findings[0].lineItemId, "uniform-1");
});

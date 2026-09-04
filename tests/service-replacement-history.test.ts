import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's type-stripping runner requires the explicit extension.
import { isExplicitlyEligibleProduct, replacementFactsForConfirmation, summarizeBilledActivitySince, validateReplacementConfirmation } from "../lib/service-replacement-history.ts";

test("AI suggestions never enable replacement tracking", () => {
  assert.equal(isExplicitlyEligibleProduct({
    id: "suggested",
    catalogStatus: "approved",
    eligibility: "unreviewed",
    category: null,
    suggestedCategory: "soap_dispenser",
  }), false);
});

test("only approved, explicitly eligible products receive controls", () => {
  assert.equal(isExplicitlyEligibleProduct({ id: "candidate", catalogStatus: "candidate", eligibility: "eligible", category: "soap_dispenser" }), false);
  assert.equal(isExplicitlyEligibleProduct({ id: "ineligible", catalogStatus: "approved", eligibility: "ineligible", category: "soap_dispenser" }), false);
  assert.equal(isExplicitlyEligibleProduct({ id: "eligible", catalogStatus: "approved", eligibility: "eligible", category: "soap_dispenser" }), true);
});

test("first tracked confirmation requires a baseline and replaced details", () => {
  const errors = validateReplacementConfirmation({ vendorProductId: "vp-1", response: "replaced", facility: "Main" }, true);
  assert.equal(errors.includes("A starting replacement history is required."), true);
  assert.equal(errors.includes("Replacement details are required."), true);
});

test("billed activity counts only actual mapped charges after replacement", () => {
  const summary = summarizeBilledActivitySince([
    { invoiceId: "before", periodKey: "2026-01", effectiveDate: "2026-01-31", lineTotalCents: 1000 },
    { invoiceId: "after-a", periodKey: "2026-03", effectiveDate: "2026-03-31", lineTotalCents: 1200 },
    { invoiceId: "after-b", periodKey: "2026-03", effectiveDate: "2026-03-31", lineTotalCents: 300 },
    { invoiceId: "unknown-date", periodKey: "unknown", effectiveDate: null, lineTotalCents: 900 },
  ], "2026-02-15", "2026-02-16T12:00:00Z");
  assert.deepEqual(summary, { billedPeriods: 1, ongoingFeesCents: 1500 });
});

test("invoice answers save separately from replacement events", () => {
  const notReplaced = replacementFactsForConfirmation({
    vendorProductId: "vp-1",
    facility: "Main",
    response: "not_replaced",
    baseline: { status: "unknown", replacementDate: null },
  });
  assert.equal(notReplaced.response, "not_replaced");
  assert.equal(notReplaced.event, null);

  const replaced = replacementFactsForConfirmation({
    vendorProductId: "vp-1",
    facility: "Main",
    response: "replaced",
    baseline: { status: "unknown", replacementDate: null },
    replacement: {
      datePrecision: "approximate",
      replacementDate: "2026-08-15",
      quantity: 2,
      facility: "Main",
      source: "vendor",
      notes: "Vendor confirmed the service ticket.",
    },
  });
  assert.equal(replaced.response, "replaced");
  assert.equal(replaced.event?.quantity, 2);
  assert.equal(replaced.event?.datePrecision, "approximate");
});

test("flows from invoice confirmation facts into saved history counters", () => {
  const confirmation = replacementFactsForConfirmation({
    vendorProductId: "vp-dispenser",
    facility: "North plant",
    response: "replaced",
    baseline: { status: "unknown", replacementDate: null },
    replacement: {
      datePrecision: "exact",
      replacementDate: "2026-06-01",
      quantity: 3,
      facility: "North plant",
      source: "facility_manager",
      notes: null,
    },
  });
  assert.equal(confirmation.event?.replacementDate, "2026-06-01");

  const savedHistory = summarizeBilledActivitySince([
    { invoiceId: "inv-confirmed", periodKey: "2026-06", effectiveDate: "2026-06-01", lineTotalCents: 4000 },
    { invoiceId: "inv-next", periodKey: "2026-07", effectiveDate: "2026-07-01", lineTotalCents: 4000 },
    { invoiceId: "inv-later", periodKey: "2026-08", effectiveDate: "2026-08-01", lineTotalCents: 4000 },
  ], confirmation.event!.replacementDate, "2026-06-01T16:00:00Z");

  assert.deepEqual(savedHistory, { billedPeriods: 2, ongoingFeesCents: 8000 });
});

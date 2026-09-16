import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's type-stripping test runner requires the extension.
import { validateStagingCommand } from "../lib/billing/domain.ts";

const eventKey = "f6120321-7e97-4d9c-a935-d0d70df3d605";
test("staging commands accept only catalog products and defined transitions", () => {
  assert.equal(validateStagingCommand({ action: "checkout", plan: "pro", eventKey }), true);
  assert.equal(validateStagingCommand({ action: "checkout", plan: "floor-mat", quantity: 3, eventKey }), true);
  assert.equal(validateStagingCommand({ action: "checkout", plan: "floor-mat", quantity: 101, eventKey }), false);
  assert.equal(validateStagingCommand({ action: "checkout", plan: "admin", eventKey }), false);
  assert.equal(validateStagingCommand({ action: "switch", plan: "agreement", eventKey }), false);
  assert.equal(validateStagingCommand({ action: "cancel", reason: "other", eventKey }), true);
  assert.equal(validateStagingCommand({ action: "cancel", reason: "refund", eventKey }), false);
  assert.equal(validateStagingCommand({ action: "reactivate", eventKey: "bad" }), false);
});

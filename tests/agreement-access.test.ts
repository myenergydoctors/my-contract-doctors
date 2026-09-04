import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's type-stripping test runner requires the extension.
import { agreementAllowance, agreementAllowanceReached, startOfUtcQuarter } from "../lib/agreement-access.ts";

test("free accounts receive one lifetime agreement preview", () => {
  assert.equal(agreementAllowance("free"), 1);
  assert.equal(agreementAllowanceReached("free", 0), false);
  assert.equal(agreementAllowanceReached("free", 1), true);
});

test("Pro receives one agreement analysis each UTC quarter", () => {
  assert.equal(agreementAllowance("pro"), 1);
  assert.equal(startOfUtcQuarter(new Date("2026-09-03T12:00:00Z")).toISOString(), "2026-07-01T00:00:00.000Z");
});

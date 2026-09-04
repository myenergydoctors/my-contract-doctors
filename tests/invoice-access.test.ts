import test from "node:test";
import assert from "node:assert/strict";
// Node's built-in type-stripping test runner requires the explicit extension.
// @ts-expect-error TypeScript's noEmit project mode otherwise rejects it.
import { FREE_INVOICE_UPLOAD_ALLOWANCE, PRO_MONTHLY_INVOICE_UPLOAD_ALLOWANCE, invoiceAllowanceReached, invoiceUploadAllowance, isProInvoicePlan } from "../lib/invoice-access.ts";

test("free and unknown plans receive one lifetime invoice upload", () => {
  assert.equal(invoiceUploadAllowance("free"), FREE_INVOICE_UPLOAD_ALLOWANCE);
  assert.equal(invoiceUploadAllowance(null), FREE_INVOICE_UPLOAD_ALLOWANCE);
  assert.equal(invoiceAllowanceReached("free", 0), false);
  assert.equal(invoiceAllowanceReached("free", 1), true);
});

test("monthly and annual Pro plans receive five invoice uploads per month", () => {
  for (const plan of ["pro", "pro-annual"]) {
    assert.equal(isProInvoicePlan(plan), true);
    assert.equal(invoiceUploadAllowance(plan), PRO_MONTHLY_INVOICE_UPLOAD_ALLOWANCE);
    assert.equal(invoiceAllowanceReached(plan, 4), false);
    assert.equal(invoiceAllowanceReached(plan, 5), true);
  }
});

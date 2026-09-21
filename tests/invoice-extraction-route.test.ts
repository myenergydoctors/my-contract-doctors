import assert from "node:assert/strict";
import test from "node:test";
import { runInvoiceFailureAudit } from "../scripts/audit-extraction-failures.mjs";

test("actual invoice route saves complete groups and rejects each injected failure", async () => {
  const results = await runInvoiceFailureAudit();
  for (const result of results) {
    assert.equal(result.passed, true, `${result.fault}: ${JSON.stringify(result.errors)}`);
    if (result.fault === 'retry_success') { assert.equal(result.writes.length, 0); assert.equal(result.body.invoice_id, 'saved-invoice'); }
    if (result.status >= 400) {
      assert.ok(result.writes.some(write => write.table === "invoice_analyses" && write.payload?.status === "failed"), `${result.fault} must mark the attempt failed`);
      assert.ok(result.writes.some(write => write.table === "document_segments" && write.operation === "delete"), `${result.fault} must remove the failed revision for retry`);
    }
  }
});

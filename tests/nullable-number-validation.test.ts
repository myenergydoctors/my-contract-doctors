import assert from "node:assert/strict";
import test from "node:test";

// Node's built-in type-stripping test runner requires the explicit extension.
// @ts-expect-error TypeScript's noEmit project mode otherwise rejects it.
import { hasInvalidOptionalNumber } from "../lib/nullable-number-validation.ts";

test("accepts null and undefined model values", () => {
  assert.equal(hasInvalidOptionalNumber([null, undefined, 0, 0.072], { maxAbsolute: 1_000_000_000 }), false);
});

test("still rejects non-numeric and unsafe values", () => {
  assert.equal(hasInvalidOptionalNumber(["12"], { maxAbsolute: 1_000_000_000 }), true);
  assert.equal(hasInvalidOptionalNumber([Number.POSITIVE_INFINITY], { maxAbsolute: 1_000_000_000 }), true);
  assert.equal(hasInvalidOptionalNumber([1.5], { integer: true, maxAbsolute: 1_000_000_000 }), true);
});

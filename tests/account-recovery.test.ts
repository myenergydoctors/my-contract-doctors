import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's type-stripping test runner requires the extension.
import { createRecoveryGrant, validRecoveryGrant } from "../lib/account/recovery-grant.ts";

test("password recovery grant is bound to one user and expires", () => {
  const now = Date.UTC(2026, 8, 16);
  const grant = createRecoveryGrant("user-1", "private-secret", now);
  assert.equal(validRecoveryGrant(grant, "user-1", "private-secret", now), true);
  assert.equal(validRecoveryGrant(grant, "user-2", "private-secret", now), false);
  assert.equal(validRecoveryGrant(grant, "user-1", "other-secret", now), false);
  assert.equal(validRecoveryGrant(grant, "user-1", "private-secret", now + 16 * 60_000), false);
  assert.equal(validRecoveryGrant(`${grant}0`, "user-1", "private-secret", now), false);
});

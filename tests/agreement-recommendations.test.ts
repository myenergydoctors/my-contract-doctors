import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's type-stripping test runner requires the extension.
import { agreementRiskScore, buildAgreementEmailTemplate, buildAgreementFindings, selectFreeAgreementFinding } from "../lib/agreement-recommendations.ts";

const renewal = {
  id: "renewal-1",
  kind: "auto_renewal" as const,
  title: "Automatic renewal",
  risk: "high" as const,
  sourcePage: 3,
  contractText: "This agreement automatically renews for 36 months unless notice is delivered 90 days before expiration.",
  plainEnglish: "Missing the notice window can create another 36-month term.",
  recommendedAction: "Calendar the deadline and request mutual written renewal.",
  noticeDays: 90,
  deadline: null,
  estimatedFinancialExposureCents: null,
};

test("always uses renewal before escalation for the stable free preview", () => {
  const findings = buildAgreementFindings([
    { ...renewal, id: "increase-1", kind: "price_escalation", title: "Price increases", contractText: "Vendor may increase prices at any time." },
    renewal,
  ]);
  assert.equal(selectFreeAgreementFinding(findings)?.kind, "auto_renewal");
});

test("uses price escalation when no renewal clause was extracted", () => {
  const findings = buildAgreementFindings([{ ...renewal, kind: "price_escalation", title: "Price increases" }]);
  assert.equal(selectFreeAgreementFinding(findings)?.kind, "price_escalation");
});

test("does not create findings without quoted agreement language", () => {
  assert.deepEqual(buildAgreementFindings([{ ...renewal, contractText: "" }]), []);
});

test("creates a paid renewal email from the actual clause", () => {
  const finding = buildAgreementFindings([renewal])[0];
  const email = buildAgreementEmailTemplate(finding, { vendor: "Example Uniform", businessName: "Harbor Cafe" });
  assert.match(email.body, /automatically renews for 36 months/);
  assert.match(email.body, /mutual written agreement/);
  assert.match(email.body, /Harbor Cafe/);
});

test("risk score is deterministic", () => {
  const findings = buildAgreementFindings([renewal, { ...renewal, id: "fee", kind: "fee_rights", risk: "medium" }]);
  assert.equal(agreementRiskScore(findings), 83);
});

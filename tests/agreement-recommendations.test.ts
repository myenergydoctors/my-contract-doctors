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
  sourceVerified: true,
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

test("no-minimum protection never receives a request to introduce or adjust minimums", () => {
  const [finding] = buildAgreementFindings([{ ...renewal, kind: "minimum_commitment", contractText: "No minimum billing applies. Only actual delivered quantities are billed." }]);
  assert.equal(finding.assessment, "protection");
  assert.equal(finding.risk, "low");
  const email = buildAgreementEmailTemplate(finding, { vendor: null, businessName: null });
  assert.match(email.body, /not requesting that it be removed/);
  assert.doesNotMatch(email.body, /minimum billing and quantity commitments adjust/);
});

test("termination exceptions stay with the fee, with their own source page", () => {
  const findings = buildAgreementFindings([
    { ...renewal, id: "fee", kind: "early_termination", contractText: "Early termination requires a fixed fee of $200.00.", sourcePage: 1 },
    { ...renewal, id: "exception", kind: "early_termination", contractText: "No termination fee applies following an uncured material vendor breach.", sourcePage: 2 },
  ]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].assessment, "mixed");
  assert.equal(findings[0].contextQuotes[0].sourcePage, 2);
  const email = buildAgreementEmailTemplate(findings[0], { vendor: null, businessName: null });
  assert.match(email.body, /\$200\.00/);
  assert.match(email.body, /uncured material vendor breach/);
  assert.match(email.body, /Preserve all existing customer protections/);
});

test("unverified or legacy quotes cannot generate an actionable email", () => {
  assert.equal(buildAgreementEmailTemplate({ ...renewal, priority: 0, sourceVerified: false }, { vendor: null, businessName: null }), null);
  assert.equal(buildAgreementEmailTemplate({ ...renewal, priority: 0, sourceVerified: undefined }, { vendor: null, businessName: null }), null);
  assert.equal(buildAgreementEmailTemplate({ ...renewal, priority: 0, contextQuotes: [{ sourcePage: 2, contractText: "No fee applies.", sourceVerified: false }] }, { vendor: null, businessName: null }), null);
});

test("already-capped price language does not receive a weaker invented cap", () => {
  const [finding] = buildAgreementFindings([{ ...renewal, kind: "price_escalation", contractText: "Increases are capped at 1 percent once annually with 90 days notice." }]);
  const email = buildAgreementEmailTemplate(finding, { vendor: null, businessName: null });
  assert.match(email.body, /1 percent/);
  assert.doesNotMatch(email.body, /3%|CPI/);
});

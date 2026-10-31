# Demystifier access and verification

The Demystifier reader has seven educational, fictional clause examples with
explanations, review questions, vendor drafts and a pre-signing checklist. It
never presents sample wording as a quotation from the customer's agreement.
Drafts are copied for the customer to review and send; no vendor email is sent.
Checklist ticks are explicitly temporary for the current page.

## Customer flow

- `/demystifier` loads the current server access snapshot, with loading, error
  and retry states. One complete minimum-billing/cancellation example is free.
- Other topic titles are public, but their text, explanations, drafts and the
  checklist are absent from unauthorized API responses and client bundles.
- Shared checkout requires sign-in to save a preview. Its success page links
  back to the Demystifier and states that $0 was charged and no access granted.
- Restore saved access rechecks the current account on the server. Signing in
  preserves the return path. A fresh session restores existing access without
  a new purchase or local-storage unlock.
- Access comes only from an active, unrevoked, account-wide `demystifier` row in
  the existing server-managed `billing_entitlements` table. The server verifies
  the current authenticated owner, confirmed email and active profile. Plan,
  user-editable metadata, URL parameters and checkout-preview records grant no
  access. Other product/resource entitlements do not grant Demystifier access.
- Failed checks remove the currently displayed protected content and show a
  retry message. Restore checks and fresh loads honor revocation. As with any
  downloaded digital content, a revocation cannot retract a previous copy.

## Payment boundary

No payment provider or production activation was added. Preview checkout does
not grant any entitlement. Future payment fulfillment must verify its provider
signature and owner before using the existing server-only verified-event
boundary. Browser roles cannot invoke that boundary or write entitlements.
Synthetic QA grants are fixtures created with the approved service role for
identified disposable accounts, not a customer-access or checkout feature.
Content and pricing still require the owner's product review before selling.

No schema migration or new secret is required for this flow.

## Verification

- `tests/demystifier.test.ts` exercises unauthorized payloads, exact entitlement
  constraints, deactivated/unverified accounts, private caching and safe errors.
- `tests/demystifier.e2e.test.ts` uses two disposable accounts against the allowed
  My Contract Doctors project. It verifies zero-charge/no-grant checkout,
  idempotent synthetic verified events, fresh-session restore, cross-account
  isolation, denied browser grants, forged metadata, revocation and deactivation.
  It cleans its accounts, unshared organizations and billing fixtures.
- Run the opt-in integration with `DEMYSTIFIER_E2E=true` and
  `DEMYSTIFIER_E2E_PROJECT=xrchncayomnwcnphrwhx` using the approved local env.
- Browser acceptance covers free/locked content, copy feedback, sign-in return,
  saved checkout, full reader, all topics, temporary checklist, refresh and
  revocation. Sanitized results are recorded in
  `output/audit/demystifier-flow-results.json`.

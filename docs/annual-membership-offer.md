# Annual membership introductory offer

The campaign `annual30-v1` reserves 30% off the first annual Pro term: $219.24 instead of the advertised $313.20 annual price, a $93.96 reduction. Later annual terms use the then-current full annual price. Pro allowances remain unchanged; this is not an unlimited-use tier.

## Entry points

- A native modal appears five seconds after arriving on a marketing page. It does not interrupt upload, analysis, auth, account, checkout, or reviews pages. A browser dismissal suppresses future automatic displays; explicit upgrade buttons can still reopen the offer.
- Analysis results and existing paywalls include an optional annual upgrade offer.
- One-time/monthly checkout offers the annual comparison before proceeding.
- The saved one-time/monthly checkout confirmation also offers the next-level annual upgrade. The existing one-time or monthly option remains available.

The popup replaces the old homepage-only 10% form and the separate exit-intent popup, preventing competing promotions. It supports Escape, an explicit close control, a full-price decline choice, focus containment, and scrolling on small screens through the native dialog element.

## Capture and eligibility

`POST /api/annual-offer` validates origin, rate limits requests, validates/normalizes the email, and stores a private reservation. This is offer-related email capture only, not newsletter consent. No email is sent automatically. The interface confirms a saved offer rather than claiming an email was delivered.

A signed HTTP-only cookie remembers the anonymous reservation. A signature alone does not authorize a discount. Checkout requires a signed-in account with the same verified email (or an already bound account), checks current membership and prior annual payments, and binds the reservation to the account. Reservations are unique per campaign/email and campaign/account. Redeemed reservations cannot be reused. Existing paid Pro members are ineligible. Unverified sign-ins cannot apply the discount.

`/dashboard/admin/annual-offers` lists captured emails, source, account linkage, reservation/redemption status, and date. The page is protected by the canonical administrator flag. RLS and revoked browser grants keep the underlying table private.

## Checkout boundary

Checkout is still the existing no-charge staging simulation. The offer does not charge, activate membership, grant entitlements, or mark the offer redeemed. `/api/billing` derives the correct discount from the server catalog; client prices/percentages are ignored. It records the original annual price plus a first-term/renewal quote in the preview record. Retries use the existing billing event key. A preview does not consume the offer.

When live payment fulfillment is implemented, the verified provider-success path must atomically redeem the reservation and use its payment reference; renewals must use the normal annual price. There is deliberately no browser-callable redemption endpoint. These changes do not implement a payment provider or live subscription billing.

## Verification

- `node --test tests/annual-offer.test.ts`: integer-cent math, input validation, tamper-proof cookie signatures, privacy grants, reservation uniqueness, and redemption-state consistency using real PostgreSQL/PGlite.
- `OFFER_AUDIT_PROJECT=xrchncayomnwcnphrwhx OFFER_AUDIT_ENV_DIR=/path/to/configured/checkout node scripts/audit-annual-offer-flow.mjs`: opt-in localhost integration checks with disposable ordinary accounts. Tests capture, account matching, price tampering, idempotency, no-charge/no-entitlement behavior, saved-offer persistence, post-checkout upgrade content, and reuse denial after a synthetic redemption. Removes synthetic captures and accounts. No admin privileges are granted and no email is sent.
- Production build, TypeScript and scoped lint; browser QA for the five-second modal, dismissal, and contextual opening.

The annual checkout catalog is aligned with the existing advertised $313.20 annual price (10% below twelve $29 monthly payments). The introductory 30% is calculated from that annual price, not from $348 of monthly payments. Historical preview records are unchanged.

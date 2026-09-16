# My Contract Doctors — Unfinished Product Flows

Last updated: September 16, 2026

This is the working handoff for completing the customer-facing product around the invoice and agreement analysis engines. It separates intentional testing behavior from functionality that still needs to be built.

## Current product decisions

- Keep the dashboard **View as** control during testing. It is useful for previewing New, Free, Agreement, and Pro experiences.
- Before a public launch, restrict View as to administrators or a non-production/test flag. Preview selections must never change server authorization or paid access.
- Keep billing and checkout in **staging/preview mode** for now.
- Do not commit to Stripe yet. The billing design should be provider-neutral so Stripe, Paddle, Lemon Squeezy, Chargebee, or another provider can be connected later.
- Preview checkout must state clearly that no charge, subscription, entitlement, or physical order is created.
- Do not replace real live-mode data with mock values. Mock data belongs only in an explicitly selected preview mode.

## What is already real

- Supabase email/password authentication, magic-link authentication, and email confirmation
- Invoice upload, AI extraction, line-item review, corrections, confirmation, saved results, and reprocessing
- Agreement upload, AI extraction, confirmation, saved findings, and agreement-specific access checks
- Shared vendor catalog import and vendor-code matching
- Core Service & Replacement History persistence: eligibility classification, baselines, invoice responses, replacement events, evidence storage, and history summaries
- Contact-form delivery through SendGrid

## How subscriptions are set up today

There is no active subscription processor.

- `profiles.plan` is the effective access flag used by server and client checks. Supported values are `free`, `agreement`, `pro`, and `pro-annual`.
- The database contains a `subscriptions` table designed around Stripe. It has fields such as `stripe_customer_id` and `stripe_subscription_id`, but it is not being synchronized by a provider or webhook.
- The billing page now reads user-owned staging subscription and no-charge billing records. The billing migrations are applied to Supabase project `xrchncayomnwcnphrwhx`.
- Checkout plans are all marked `preview`. Submitting checkout now requires sign-in, saves an idempotent no-charge preview record, and shows a success page tied to that saved record.
- Agreement-specific entitlements have a real database table and server-side access check, but nothing grants those entitlements after a purchase.
- A provider-neutral entitlement table now exists, but staging checkout never grants access. Verified provider events can populate it after a provider adapter is selected and connected.
- View as changes browser-side presentation only. It does not and must not grant server-side Pro access.

The useful foundation is the existing server-side plan gating and agreement entitlement check. The provider-specific subscription schema and the unfinished checkout UI should not be treated as a commitment to Stripe.

## Priority 1 — Billing and subscription lifecycle

Status: Staging implementation added September 16, 2026. The billing migrations were applied to the explicitly approved Supabase project `xrchncayomnwcnphrwhx`. The [Vercel preview](https://my-contract-doctors-git-codex-billing-rel-a1b0c0-osc-web-design.vercel.app/) from branch `codex/billing-release-pass` has been verified. Production releases come from `main`; check the Vercel production deployment for the current rollout. No payment provider or real charges are connected.

Verification: The existing automated suite, type check, lint, and production build pass locally. The database lifecycle test passed against project `xrchncayomnwcnphrwhx` after both billing migrations were applied. A browser walkthrough on the Vercel preview saved a Pro checkout with `charged_cents=0`, left `profiles.plan=free`, created no entitlement, and showed the record in Billing history; the disposable account was deleted. The lifecycle test creates and deletes its own test accounts and requires `BILLING_E2E=true`, `BILLING_E2E_PROJECT_REF` set to the explicitly approved project, and matching Supabase credentials. The dashboard labels this project's main branch PRODUCTION, so treat further database changes to this ref accordingly.

The local provider-neutral billing domain preserves preview checkout. The migration adds subscription state, billing records, entitlements, and an idempotent event ledger. A future payment provider will call into a verified-event boundary after signature verification is implemented:

- Plan catalog and pricing configuration
- Subscription states: trialing if used, active, past due, canceled at period end, canceled, and paused if supported
- Current billing period and renewal date
- One-time purchases and product-specific entitlements
- Billing history and receipt/invoice records
- Upgrade, monthly/annual switch, scheduled downgrade, cancel-at-period-end, reactivation, and failed-payment recovery
- Idempotent provider event processing and an audit trail
- A provider adapter boundary so payment-vendor fields do not leak throughout the application
- Server-authoritative entitlements; never trust View as or browser storage

Recommended cancellation experience:

1. Explain the exact access and history affected.
2. Ask the primary reason for leaving.
3. Offer only honest, configured alternatives, such as switching cadence or moving to Free while preserving saved records read-only.
4. Default to cancellation at the end of the paid period unless an immediate cancellation/refund is explicitly chosen and supported.
5. Show the effective date and send confirmation.
6. Allow reactivation before the period ends.

Avoid inventing discounts, pause support, refund rights, or retention offers that the selected provider and business policy cannot honor.

### New-session prompt: billing

> Complete the billing and subscription lifecycle for My Contract Doctors in staging mode. Remove the Demystifier’s fake card-entry form as an immediate safety fix. Keep the dashboard View as control because it is used for testing, but ensure it never grants server-side access. Do not choose or integrate Stripe or any other payment provider yet. First inspect the existing checkout plans, `profiles.plan`, `subscriptions` schema, agreement entitlements, billing page, and current tests. Build a provider-neutral billing service and data model that can later accept events from any provider. Wire the billing page to real staging subscription and billing records rather than `mockUser` or fabricated history. Implement staged upgrade, monthly/annual switch, scheduled downgrade, cancel-at-period-end, reactivation, billing-history detail, and honest retention choices. Preserve saved customer records when moving to Free and make the access consequences explicit. Keep checkout visibly marked as a no-charge preview. Add server authorization, idempotency/audit protections, and end-to-end tests for each lifecycle transition. Read the repository's Next.js guidance before changing application code, preserve existing invoice/agreement flows, run the relevant tests and production build, and do not deploy until I approve the completed staging behavior.

## Priority 2 — Legal and account lifecycle

Status: Important customer-trust and launch work.

- Create real Terms & Conditions and Privacy Policy routes; replace every `#` link in sign-up, checkout, footer, and cookie notices.
- Document data collected, AI processing, document retention, subprocessors, marketing consent, cookies, deletion, refunds, and contact information. Treat legal copy as requiring counsel review before launch.
- Wire profile changes to the real profile record.
- Decide whether email changes are supported; if so, require verification.
- Implement avatar upload/removal with type and size validation.
- Implement Forgot Password, reset-password completion, and signed-in password change.
- Persist notification and marketing preferences.
- Implement account deletion with reauthentication, clear consequences, deletion/export rules, storage cleanup, and subscription handling.
- Add success/error states and an audit trail for sensitive account changes.

### New-session prompt: legal and account lifecycle

> Complete the legal and account-lifecycle flows for My Contract Doctors. Inspect all existing authentication, profile, settings, storage, invoice, agreement, consent, and billing-preview behavior first. Add real Terms & Conditions and Privacy Policy pages and replace every placeholder legal link, while clearly marking the copy for final attorney review rather than presenting generated text as legal approval. Wire profile editing, avatar changes, notification preferences, Forgot Password, password reset, signed-in password change, and verified email change if supported. Implement a safe account-deletion flow with reauthentication, explicit consequences, subscription/entitlement handling, database and uploaded-file cleanup, and an auditable result. Preserve the current invoice and agreement flows. Add tests covering authorization, failure states, and complete deletion. Read the repository's Next.js guidance before changing application code, run the relevant tests and production build, and do not deploy until I approve it.

## Priority 3 — Demystifier product flow

Status: Prototype only.

The fake card form and timer-based browser unlock were removed as a billing safety fix. The free preview links to shared no-charge staging checkout. Full access and restore-access still need the dedicated Demystifier implementation.

Needed:

- Continue using the shared, clearly labeled staging checkout in place of the removed fake payment form.
- Keep the free preview genuinely accessible without implying a purchase occurred.
- Define a provider-neutral Demystifier entitlement and server-side access endpoint.
- Restore access for an authenticated purchaser across devices and sessions.
- Decide whether purchase requires sign-in before checkout or supports claim-after-purchase.
- Wire every navigation and action, including the invoice-analysis call to action.
- Keep negotiation emails copyable; do not claim they were sent.
- Add staged purchase, entitlement, restore-access, locked-content, and failure-path tests.

### New-session prompt: Demystifier

> Turn the Demystifier from a prototype into a complete staging product flow. Keep payments in no-charge staging mode and do not select a payment provider. Remove the fake card-number modal and route purchases through the shared provider-neutral preview checkout. Preserve one useful free clause preview, add a server-authoritative Demystifier entitlement, require or capture an authenticated owner, persist staged access across sessions, and provide a restore-access path. Ensure locked clauses cannot be exposed by browser-only state. Wire all calls to action and keep vendor emails as honest copyable templates unless real sending is implemented. Add tests from free preview through staged checkout, entitlement grant, returning-user access, and failure handling. Read the repository's Next.js guidance before changing application code, preserve the working invoice/agreement flows, run the relevant tests and production build, and do not deploy until I approve it.

## Priority 4 — Live dashboard truthfulness

Status: Mixed real and mock data.

- Keep mock dashboard data only when a tester explicitly selects a View as mode.
- In Live mode, calculate every overview card from real records or show an honest empty/unavailable state.
- Replace hard-coded agreement-risk and outstanding-action counts.
- Remove fabricated billing history from Live mode.
- Remove fabricated notifications from Live mode.
- Remove fabricated Industry Insights statistics from Live mode.
- Add a strong, persistent visual distinction between Live and preview modes so screenshots and testing results cannot be confused.
- Consider an administrator/tester permission before public launch without removing the tool during development.

## Priority 5 — Notifications and ongoing monitoring

Status: Storage/read helpers exist; event generation and delivery do not.

- Generate in-app notifications when invoice or agreement analysis completes or fails.
- Implement renewal-window scheduling from confirmed agreement dates.
- Implement ongoing invoice-versus-agreement monitoring instead of only displaying explanatory text.
- Generate service-history follow-up reminders and completion notifications.
- Wire filtering, unread counts, individual read state, and Mark all read.
- Persist email-alert preferences.
- Add scheduled jobs and retry/error visibility.
- Add email delivery only for opted-in events, with unsubscribe/preference handling.

## Priority 6 — Insights, benchmarks, and comparisons

Status: Database foundation exists; displayed figures are mock data.

- Never present sample counts or savings as real customer-network statistics.
- Build a normalized product/category mapping workflow needed for comparisons.
- Define minimum sample thresholds and privacy rules.
- Build regional and vendor comparisons only where sufficient comparable data exists.
- Show methodology, sample size, date range, and limitations.
- Use unavailable/insufficient-data states rather than invented results.
- Version calculations so a displayed finding can be reproduced later.

## Priority 7 — Service & Replacement History operations

Status: Core saving/history flow is real; operational follow-through is incomplete.

- Review and explicitly approve eligible catalog items. AI suggestions must remain suggestions and never silently enable tracking.
- Add a direct manual Add replacement action from the history page, while preserving invoice-linked capture.
- Let customers open/download authorized evidence rather than showing only an Evidence attached badge.
- Turn Ask the vendor into a real draft/send/copy workflow with recipient, status, and response tracking.
- Turn Assign to facility manager into a real assignment with an identified person, notification, due date, completion, and reminder state.
- Allow open follow-ups to be viewed, resolved, reassigned, or canceled.
- Keep replacement events separate from invoice charges and preserve the rule that an absent charge is never proof that no replacement occurred.
- Test non-Pro enforcement using the real stored plan, not View as.

## Priority 8 — Email capture, guide delivery, and discounts

Status: Contact email is real; most marketing capture is simulated.

- Deliver the promised free guide or change the success language until delivery exists.
- Connect blog newsletter forms to a real consent-aware subscriber store/provider.
- Record consent source and timestamp.
- Add unsubscribe and preference-management flows before sending marketing email.
- Decide whether invoice/agreement leads should receive analysis-ready email and implement it honestly.
- Keep discount claiming/redemption disabled until a billing provider and entitlement flow can honor it.
- Do not let chat offer a code that cannot be redeemed.

## Priority 9 — Onboarding and customer profile

Status: The four-step UI works, but its answers are discarded.

- Persist business name, industry, vendor, estimated spend, and completion state.
- Prefill known profile values and support skip/resume.
- Use answers only where they genuinely personalize the product.
- Do not promise calibrated recommendations from fields that are not consumed.
- Prevent completed customers from being forced through onboarding again.

## Priority 10 — Authentication convenience

Status: Email/password and magic link work; social buttons do not.

- Either connect Google, Microsoft, and Apple through Supabase or remove/label the buttons until configured.
- Test callback, account linking, duplicate-email, canceled-consent, and provider-error cases.
- Finish password recovery before treating authentication as complete.

## Priority 11 — Modules and waitlists

Status: Uniform/Linen is active; several modules are marketing placeholders.

- Keep unreleased modules clearly marked Coming soon.
- Replace the generic contact-form destination with a module-specific waitlist if Notify me remains.
- Store module interest and consent, and provide a confirmation/unsubscribe path.
- Do not imply telecom, waste, merchant services, insurance, or shipping analysis exists before each workflow is built and tested.

## Cross-cutting completion requirements

Every implementation session should:

- Preserve the working invoice and agreement flows.
- Keep Live and preview data strictly separated.
- Enforce authorization and entitlements on the server.
- Avoid using an absent charge as evidence that a service event did not happen.
- Provide honest empty, loading, error, retry, and partial-data states.
- Test the complete customer path, persistence, refresh/return behavior, and access boundaries.
- Update this document and any older status document whose claims have become stale.
- Run relevant automated tests and the production build before proposing deployment.

## Recommended session order

1. Billing/subscription staging foundation
2. Legal and account lifecycle
3. Demystifier flow
4. Live dashboard truthfulness
5. Notifications and monitoring
6. Service-history operational actions
7. Insights and comparisons
8. Marketing delivery and onboarding
9. Social authentication and module waitlists

# Deliverable accuracy audit — September 21, 2026

Implementation follow-up: see [Document reliability release handoff](DOCUMENT-RELIABILITY-RELEASE-HANDOFF.md) for prepared fixes, new verification, and the unapplied production migration. The findings below describe the original audited behavior.

**Decision: the document-processing foundation works, but the paid products are not ready for customer acceptance. The Demystifier is not a completed purchased deliverable.**

## What was actually tested

- Existing automated suite: 43 passed, 0 failed, 2 optional account/billing integration tests skipped.
- TypeScript check passed.
- Audited checkout: `codex/account-lifecycle`, commit `d1bd0b1`. Existing unrelated untracked work was preserved.
- Real local Next.js application on port 3004, using the configured Supabase project and real Anthropic extraction. This is not verification of the deployed production build or a browser walkthrough.
- A disposable, confirmed free account uploaded two synthetic PDFs through customer-authorized storage. One two-page invoice had three known charges; one two-page agreement had known renewal, escalation, termination, and fee language.
- Requests exercised the actual extraction, review, confirmation, and agreement-result routes. Database reads independently checked persistence. Only the disposable account was temporarily switched to Pro to inspect the full agreement response; this did not test a purchase.
- An offline harness invoked the actual invoice route with controlled AI responses and database failures. This isolates failure handling without damaging real records.
- Synthetic storage files and the disposable account were successfully removed.

Evidence: `output/audit/document-flow-results.json` and `output/audit/extraction-failure-results.json`. The network audit contains one initially incorrect assertion corrected against its captured response: the invoice-context field is `sameVendorInvoices`, not `linkedInvoiceCount`. This correction does not claim a second integration run.

## Verified working

| Capability | Observed result |
| --- | --- |
| Invoice PDF extraction | Both pages treated as one invoice; correct invoice number and page range. |
| Saved invoice values | $25.00 towels, $20.00 aprons, $5.00 service fee; $50.00 gross and total due. Quantities, rates, and weekly frequency also matched the fixture. |
| Invoice confirmation | Started in `needs_review`, zero blocking issues, then `confirmed` on a fresh API read. Reconciliation difference was zero. |
| Agreement extraction | Both pages read; correct expiration date and 60-day notice period. Calculated deadline matched August 1, 2027. |
| Source quotations | All six extracted quotations appeared on their cited source page after whitespace normalization. This was an independent audit check, not a built-in application guarantee. |
| Agreement confirmation/API gating | No findings before confirmation; after confirmation a free account received one finding, five locked findings, and no negotiation email through the application API. |
| Agreement/invoice context | Recognized the one saved invoice from the same synthetic vendor. This verifies matching context, not ongoing monitoring. |
| Full agreement response | A Pro account received six findings and six email templates containing the respective source quote. Templates are generated on read; payment activation was not tested. |

## Blocking findings

### 1. Paid agreement findings bypass the application paywall through direct database reads

**Reproduced against the configured database.** The ordinary authenticated free customer client could select `clauses,raw_analysis` from its own `agreement_analyses` row and receive all six findings plus the raw analysis. The API correctly returned one finding, but that gate does not cover direct Supabase reads. This finding concerns access to the customer's own paid analysis; cross-customer access was not demonstrated or tested here.

Relevant code: `lib/db/agreements.ts` selects entire rows from the browser; `app/api/agreements/[id]/route.ts` gates only its response. Database grants/policies must prevent direct reads of paid fields, with an appropriately limited API/view for account lists. Audit all alternate analysis/raw-response tables too.

### 2. Invoice extraction reports success after required writes fail

**Reproduced with fault injection against the actual route.** Each of these returned HTTP 200 and `ok: true`:

- Updating the primary invoice result fails.
- Inserting its line items fails.
- Inserting a second invoice fails. The response still says `invoice_count: 2` but returns only one invoice ID.

Relevant code: `app/api/invoices/extract/route.ts`, primary update around line 904, sibling failure around line 915, and line insertion around line 1026. Required writes must fail the operation; ideally persist a complete extraction atomically, with explicit failed/partial state and retry behavior. Merely logging errors is insufficient.

### 3. Invoice page completeness trusts the AI's page count

**Reproduced offline using an actual two-page PDF.** A controlled AI response reported one page and only one page of invoice content. The route accepted it as successful. Its validation checks the AI's own page count, not an independently read physical PDF count. The agreement route already reads the physical page count with `pdf-lib`; the invoice route needs equivalent validation, plus checks that every invoice segment has corresponding extracted records.

### 4. The Demystifier has no full product behind checkout

`app/demystifier/page.tsx` renders only `PrePurchasePage`. It contains one static sample explanation and six locked placeholder labels. The button navigates to shared preview checkout, whose return path is the same page.

The advertised full walkthrough, complete negotiation scripts/emails, pre-signing checklist, purchaser access, and restore-access experience are not implemented as an accessible full product in this route. `lib/checkout-plans.ts` advertises lifetime access, but sets `checkoutMode: "preview"`. No verified payment webhook exists. The page does disclose that full access is inactive.

The uploaded **Agreement** review is a separate, substantially implemented deliverable. Its six findings and emails do not mean the generic **Demystifier** product has been built.

### 5. Correct quotations do not establish correct recommendations

The agreement fixture explicitly said **no minimum billing applies**, yet it generated a minimum-commitment finding. The email builder chooses its amendment request solely from clause category, so that finding receives a request to adjust minimum commitments even though the quoted clause already excludes them. Similarly, favorable termination exceptions can become separate findings with the same generic termination-change request.

Relevant code: `lib/agreement-recommendations.ts`, `buildAgreementEmailTemplate` and `requestFor`. Distinguish protections from obligations and problems; preserve exceptions in the same analysis; derive requests from the actual provision and avoid asking customers to weaken favorable terms. This is a content-consistency finding, not an opinion about enforceability.

The static Demystifier also describes minimum billing as 80% of the original agreement value, while its displayed source text says 80% of agreement value **or current invoice amount, whichever is greater**. That explanation omits a material part of its own example.

### 6. Invoice result profiling fails against the current database schema

**Observed in the real local server logs during confirmation.** `profileInvoiceLead` in `app/api/invoices/[id]/review/route.ts` filters `invoice_line_items.excluded_from_totals`, but Supabase returned error `42703`: `column invoice_line_items.excluded_from_totals does not exist`. The function logs the error and returns, so confirmation still succeeds while finding counts and categories are not profiled for the lead. The integration fixture did not create a marketing lead; the failing query executes before any lead update and is still a real schema mismatch. Use the actual exclusion/review fields and test the complete lead-capture-to-confirmation path.

## Accuracy limits and unfinished delivery

- Application agreement validation checks response structure/page indices, not whether each quotation exists in the document. The successful sample does not measure hallucination rates.
- No representative customer-document evaluation set or documented accuracy score was found in the test suite. One clean invoice and one clean agreement cannot establish performance on scans, handwriting, dense tables, credits, ambiguous dates, or missing pages.
- Saved web results and copyable agreement emails are implemented. This audit did not verify a downloadable customer report, result-email delivery, real payment fulfillment, refund/revocation, restore access, or scheduled monitoring.
- Existing upload corrections/reprocessing have implementation code, but were not exercised in this integration run. Desktop file selection, actual phone handoff, browser rendering, separate-session restoration, wrong-document rejection, and cross-account isolation remain acceptance cases.
- The current recommendation risk score is a calculation over AI-assigned risk categories; it is not independently calibrated proof of financial or legal exposure.

## Recommended completion order

1. Close alternate reads of paid agreement content and add free/paid/cross-account database access tests.
2. Make required extraction writes reliable and reject incomplete physical page coverage. Convert the reproduced failures into passing regression tests after fixes.
3. Correct clause interpretation and template generation, especially protections, exceptions, and absent obligations.
   Repair the confirmed-invoice profiling schema mismatch and verify its saved result counts.
4. Build the complete Demystifier content and authenticated access/restore flow. Keep staging checkout honest until verified payment fulfillment exists.
5. Establish owner-reviewed ground truth for a representative set of invoices and agreements. Compare every amount, date, quote, page reference, supported finding, and requested amendment; track omissions as well as wrong values.
6. Run full customer acceptance on the intended deployment: upload, correction, confirmation, reopen/new session, paid unlock, artifact delivery, and failure recovery.

## Reproducing the audit

- `node scripts/audit-extraction-failures.mjs` is offline and currently exits nonzero because it demonstrates four unresolved defects.
- `scripts/audit-document-flow.mjs` is opt-in, requires `DOCUMENT_AUDIT_PROJECT` matching the configured project, and accepts only a localhost application origin. It creates/removes its own account and files and incurs real extraction usage. Do not add it to the default unit-test command.
- Application behavior and database schema were not changed by this audit. No deployment was performed.

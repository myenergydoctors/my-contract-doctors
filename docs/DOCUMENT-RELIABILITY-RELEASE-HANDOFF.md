# Document reliability and paid-result fixes

Prepared September 21, 2026 on `codex/account-lifecycle` (base `d1bd0b1`).

**Implementation and local verification are complete. No production deployment or database migration has been applied.** This work addresses steps 1–3 from the deliverable audit, not the standalone Demystifier.

## Changes ready for release

- Invoice results remain `processing` until required invoice, line, segment, and job saves succeed. The whole invoice group is published in one update. Errors fail the attempt instead of returning success with missing rows. Processing/failed invoices cannot be confirmed through the review API.
- Physical PDF page count is read independently. Model output must cover every invoice segment exactly once, with valid line-page references and nonempty invoice lines.
- Retrying a successful upload reuses its saved result. Explicit reprocessing retains the old invoice until its replacement succeeds. Concurrent attempts are rejected; stale processing attempts can be retried after 15 minutes. Failed revision segments are removed so retry can reuse that revision.
- Allowance rejection no longer deletes the supplied file path, which could belong to an already saved document. Primary invoices are counted by sibling index instead of the nullable parent field, because successful primary rows reference themselves.
- Invoice result profiling uses confirmed rows, not the nonexistent `excluded_from_totals` column. Excluded lines are also filtered from the customer result helper. Failed profiling returns a specific retryable error rather than claiming that result metadata was saved.
- Agreement account lists use a server-owned projection. The migration removes customer access to the full agreement table and alternate raw AI responses in invoice/document tables. Limited invoice and job metadata remain readable under their existing ownership/account policies. The migration also grants the server the missing lead-table permissions.
- Agreement quotations are matched against the cited page's PDF text layer using PDF.js. Searchable-PDF mismatches fail analysis. Scan/image or legacy quotations without independently verified text are labeled unverified and cannot generate an email template. This preserves readable analysis without presenting unverified text as a checked quote.
- Clause handling distinguishes protections, obligations, mixed terms, and uncertainty. Separately extracted protections stay attached to their related obligations with their source pages. Negotiation emails retain exceptions and favorable terms and avoid invented or weaker price caps and minimums. Impossible dates are rejected, quotations are not silently truncated, and generated clause IDs cannot collide and silently discard findings.
- PDF.js's worker is explicitly included in the production bundle; deployment requires Node 22.13+ or Node 24.

## Verification

- **54 automated tests passed; 0 failed; 2 existing opt-in account/billing tests skipped.** The invoice-route test includes ten scenarios: successful single/multiple invoices, successful retry reuse, required-write failures, and missing physical pages.
- Actual PostgreSQL engine (isolated PGlite) applied the migration twice. Tests verify denied raw-content reads and entitlement writes, preserved owned invoice metadata, cross-owner row isolation, and server-role access.
- Actual agreement-route tests cover sign-in, ownership, free preview, Pro, one-time entitlement, revocation, and safe account lists.
- Actual invoice-review-route test verifies excluded lines do not inflate result counts and failed metadata writes return an explicit error.
- TypeScript and production build passed. Build trace confirms the PDF worker is packaged.
- Lint passed with 0 errors and 22 existing warnings.
- Real configured Supabase/Anthropic integration: a two-page invoice saved the known three lines and $50 total; a customer correction persisted and reconciled to $55. The two-page agreement returned correct dates and source quotations, kept its termination exception, treated no-minimum language as a protection, and returned five verified Pro email templates. Saved access survived a fresh sign-in.

The integration run deliberately did **not** claim a clean production pass: direct raw agreement reads still succeed, and result-contact/profiling writes still fail with missing database grants, until the migration is applied. Synthetic files were removed. A disposable account initially could not be deleted because correction records restrict deletion of their author; removing its test invoice parents first allowed the account cleanup to succeed. The audit script now performs that order automatically.

Evidence is in `output/audit/document-flow-results.json`, `tests-after-fixes.txt`, `lint-after-fixes.txt`, and `build-after-fixes.txt`. The original audit evidence was preserved in `document-flow-before-fixes.json`.

## Coordinated release still required

Review and ship the application changes together with:

`supabase/migrations/20260921120000_protect_analysis_content.sql`

The old app selects whole agreement/invoice/job rows. Applying the restrictive grants while those old clients remain in use will make their queries fail. Publish the compatible application before applying the restrictive portion, and have users reload open account pages afterward. The service-role lead grants can be applied first; they grant nothing to browser users. The full migration remains repeatable.

This checkout already contains account-lifecycle work. Confirm its release scope and outstanding account-lifecycle checks before deploying the whole branch; do not accidentally release unrelated work.

After the coordinated release, run the opt-in document audit **without** `DOCUMENT_AUDIT_PENDING_MIGRATION=true`. Require result-contact capture, profiled finding counts, and blocked direct database reads to pass. Repeat free/Pro/one-time access checks and review the account list in the browser. No payment provider, purchase fulfillment, or Demystifier product content was added.

## Practical limits

Independent quote matching is not a legal or semantic accuracy certification. Scans without a text layer need a verified transcription/review process before actionable emails can be enabled. Legacy saved results also withhold emails until their source is independently verified. A broader owner-reviewed collection of real customer documents is still needed to measure missed provisions and extraction accuracy beyond the clean synthetic fixtures.

Invoice persistence uses staged writes and a final group publication, not one transaction spanning every ancillary table. Network/process failures can leave a failed or stale attempt for retry; they must not be represented as a successfully completed report. Catalog observations remain non-authoritative and do not determine paid access or verified savings.

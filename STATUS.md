# My Contract Doctors — Status (as of 2026-07-13)

**Read this first when resuming work.** `CLAUDE.md` is stale (describes an early mocked-only version). This file reflects actual current state. Update it whenever a phase wraps.

## TLDR
The site has grown far past the CLAUDE.md brief: real Supabase auth, a real database, and a working AI invoice-extraction pipeline are all live. Checkout/Stripe is still mocked. Dashboard is a mix of real-data and mock-data sections (see table below). Local dev runs on **port 3002** (3000 is used by another site).

## What's real vs. mocked

| Area | Status |
|---|---|
| Auth (sign-up/sign-in/magic link/OAuth, email confirm) | ✅ Real Supabase auth, fully wired |
| Database (`profiles`, `invoice_analyses`, `agreement_analyses`, `notifications`, `products`, `vendors`, `invoice_line_items`, `invoice_extraction_jobs`) | ✅ Real, RLS enabled, 3 migrations applied |
| Invoice upload + AI extraction | ✅ Real end-to-end: upload → Supabase Storage → Claude (`claude-sonnet-4-20250514`) → parsed line items → DB |
| Dashboard → Invoices (list + detail) | ✅ Real data, includes ExtractionInspector + reprocess button |
| Dashboard → Notifications | ✅ Real data (`lib/db/notifications`), mock fallback in demo mode |
| Dashboard → Agreements (list) | ⚠️ Partial — list uses real data via `useEffectiveData()`, but detail page (`agreements/[id]`) + `ClauseExplorer` still import mock data directly (no agreement-extraction pipeline exists yet — only invoices) |
| Dashboard → Billing, Insights, Settings | ❌ Still `lib/mock-data.ts` |
| Checkout / Stripe | ❌ Fully mocked — `CheckoutForm.tsx` does `setTimeout` then redirects to success. No `stripe` package installed, no Stripe env vars. Comment: `// Simulate processing — replace with Stripe in Phase 2` |
| Free guide email capture | ❌ Mocked (`app/free-guide/page.tsx:14`) |
| Public `/invoice` and `/agreement` pages (unauthenticated demo) | ⚠️ Intentional mock fallback for non-signed-in visitors |

## Database schema (docs/*.sql — run these in Supabase in order)
1. `docs/supabase-schema.sql` — Phase 2B: profiles, invoice_analyses, agreement_analyses, notifications, subscriptions (Stripe-shaped, unused)
2. `docs/supabase-schema-2c.sql` — Phase 2C-1: products (~50 seeded), vendors (~19 seeded w/ aliases), invoice_line_items, invoice_extraction_jobs
3. `docs/supabase-schema-2c-15.sql` — Phase 2C-1.5 (latest): `line_type` enum (charge/credit/past_balance/late_fee/discount/tax/other), totals-breakdown columns, multi-invoice linkage (`parent_upload_id`, `sibling_count`, `sibling_index`), debug view `invoice_totals_check`
- Also: `docs/supabase-storage-2c.sql` (storage bucket policies), `docs/supabase-grants-2c.sql` (fixes a 42501 permission-denied bug on `invoice_extraction_jobs` — apply if you see that error again)

## Invoice extraction pipeline (the core of Phase 2C)
- `app/api/invoices/extract/route.ts` — auth check → creates `invoice_analyses`(processing) + `invoice_extraction_jobs` rows → downloads file from Storage → base64 → sends to Claude with live product/vendor taxonomy injected into the prompt → classifies doc type (aborts 422 if not an invoice) → detects multiple invoices per PDF (writes one row per invoice, linked via `parent_upload_id`) → classifies every line item's `line_type` → reconciles totals (`gross - credits + past_balance + late_fees + taxes` vs `total_due`, flags `totals_reconciled`) → tracks `ai_cost_cents`.
- `app/api/invoices/reprocess/route.ts` — deletes invoice + siblings + line items/jobs, re-runs extraction against the original stored file (button in dashboard invoice detail).

## Env vars required (already in local `.env.local`)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `SENDGRID_API_KEY`. No Stripe keys yet (checkout is mocked).

## Known rough edges to check before resuming
- `app/onboarding` — not yet confirmed whether it writes business/industry info back to `profiles` on signup. Verify before relying on it.
- `app/dashboard/settings` "Save changes" button has no visible save handler — likely non-functional.
- Extraction pipeline had several rounds of 500-error / permission-denied fixes (`83b4e66`, `095294f`, `b462a0a`, `718c6c6`). If a fresh Supabase project is used, re-apply `docs/supabase-grants-2c.sql`.

## Outstanding priorities (updated)
1. Stripe integration (checkout, invoice upgrade, demystifier, agreement) — nothing wired yet
2. Wire agreement analysis to a real extraction pipeline (currently only invoices have one) — would unlock `agreements/[id]` and `ClauseExplorer`
3. Replace mock data in Billing, Insights, Settings dashboard sections
4. Free-guide email capture — connect to real list (SendGrid/Kit?)
5. Verify onboarding writes to `profiles`
6. Agreement pricing still may show placeholder — check `app/agreement` and `app/checkout/[plan]`
7. Original CLAUDE.md items not yet superseded: custom logo, full mobile responsive pass, remaining Tailwind inline-style cleanup (status of this not re-verified in this pass)

## Dev
```
npm run dev   # runs on port 3002 locally (not 3000)
```
Deploys automatically via Vercel on push to `main`.

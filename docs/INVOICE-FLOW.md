# Invoice flow — implementation and launch checklist

Updated: September 3, 2026

Source of truth: `output/pdf/my-contract-doctors-product-revenue-blueprint.pdf`, especially the Invoice Analysis flow and entitlement guardrails.

## Intended customer flow

1. A visitor chooses **The Invoice**.
2. The visitor creates a free account or signs in. The return path stays attached so authentication returns them to `/invoice`.
3. The customer uploads one PDF or image from the current device, or scans a 30-minute, one-use QR link and sends a file from a phone. The desktop recognizes the uploaded phone file automatically.
4. Before analysis, the customer confirms a results email and business name and separately chooses whether to receive marketing. Marketing consent is optional and unchecked by default.
5. The server verifies ownership, file type, file size, rate limit, and invoice allowance before spending extraction tokens.
6. The document is classified, split into invoice segments when needed, and extracted into invoice rows and line items.
7. The customer reviews the extracted invoice, corrects uncertain values, and explicitly confirms the invoice.
8. Only after confirmation, the app shows the open totals math, the exact number of supported review areas, and one stable free finding.
9. A supported floor-mat buy-versus-rent finding is first when present. Without one, the free fallback is the largest confirmed recurring charge not already represented by another finding. That fallback is a review priority, not a product pitch or promised savings.
10. When additional findings exist, their exact count is shown behind a one-time or Pro checkout preview. When there are no additional invoice findings, the page still offers Pro for reviewing the agreement behind the charges and monitoring future invoices; it does not imply that invoice findings are hidden.
11. The lead record is enriched with finding count, locked count, and free-finding category after confirmation so an authorized marketing export or integration can segment relevant offers.
12. Paid access must be activated only by verified payment fulfillment, never by reaching a checkout success URL.

## Current implementation status

| Stage | Status | Notes |
| --- | --- | --- |
| Account gate and return path | Ready | Public uploads no longer fall into a fabricated demo. Sign-up and sign-in preserve `/invoice`. |
| File selection | Ready | PDF, JPG, PNG, WEBP, and HEIC are accepted up to 25 MB. Invalid files fail before upload. |
| Phone handoff | Ready in code | A random-token, 30-minute, one-upload session sends the file through server storage and desktop polling. Requires the current migration and a phone-reachable deployment URL. |
| Pre-results email and consent | Ready in code | Results email, optional business name, and separately recorded optional marketing consent are attached to the resulting invoice. |
| Secure upload and extraction | Ready in code | Requires configured Supabase and Anthropic credentials plus current database migrations. |
| Document classification | Ready in code | Wrong-document and mixed-document cases have explicit handling. |
| Review and confirmation | Ready in code | Review state, corrections, audit history, and confirmation are persisted through server routes. |
| Finding count and free result | Ready in code | Findings are deterministic and deduplicated by line. A supported floor-mat opportunity is first; otherwise the largest recurring confirmed charge is the stable free review priority. No unsupported savings are claimed. |
| Marketing segmentation record | Ready in code | The invoice lead stores email, consent, finding count, locked count, and free-finding category. It is ready for an authorized ESP sync/export; no external marketing provider is connected yet. |
| Usage allowances | Ready in code | Free/other plans receive one lifetime primary invoice upload. Pro and Pro Annual receive five primary uploads per UTC calendar month. Reprocessing an existing upload does not consume another slot. |
| Saved invoice views | Ready in code | Free users do not see paid savings totals or paid findings in the dashboard list or home summary. |
| Checkout continuity | Preview-ready | Invoice and quantity context survive into checkout and back to the invoice. Preview completion does not charge, unlock access, or consume a discount code. |
| One-time paid entitlement | Not launch-ready | A verified payment webhook and invoice-specific access grant do not exist yet. |
| Pro billing activation | Not launch-ready | Stripe products, checkout sessions, webhook verification, subscription synchronization, and recovery handling are not connected. |
| Supported paid findings | Preview-ready | Confirmed late fees, distinct service fees, unexplained charges, and a largest recurring charge are produced by stable rules. Broader benchmarks and contract-backed savings still require more evidence. |
| Regional benchmarks | Correctly withheld | Averages remain unavailable until the stated minimum sample and geography requirements are met. |
| Floor-mat fulfillment | Preview-only | The $75 unit price, inventory, shipping, tax, and supplier fulfillment are not live. |

## Evidence rules

- Never invent a missing quantity, billing frequency, agreement right, benchmark, or comparable price.
- Label savings as estimates and expose the inputs and arithmetic.
- Do not say a rental line can be removed until the agreement supports removal; current copy states this assumption.
- Do not publish a regional average before the minimum sample requirement is satisfied.
- Keep current-period charges, credits, past balances, late fees, discounts, taxes, and total due distinct.
- Unknown charges remain in totals but are excluded from product matching and savings calculations.

## Remaining launch sequence

1. Connect Stripe products and server-created checkout sessions.
2. Add verified webhook handling for completed, renewed, canceled, refunded, and failed payments.
3. Persist invoice-specific one-time entitlements and enforce them on the server when reading paid findings.
4. Connect the authorized email-marketing provider and sync only records with `marketing_consent = true`; use finding metadata for segmentation.
5. Expand the post-confirmation finding engine with evidence references, calculation versions, and a saved report snapshot.
6. Replace the floor-mat preview with a real supplier catalog and fulfillment path, or remove it from launch scope. Add a second product only after its catalog, economics, and eligibility rule are real.
7. Run a production-like test with a fresh free account, desktop and real-phone uploads, a known sample invoice, a corrected/confirmed invoice, a second blocked free upload, five Pro uploads, a sixth blocked Pro upload, and verified payment/refund cases.

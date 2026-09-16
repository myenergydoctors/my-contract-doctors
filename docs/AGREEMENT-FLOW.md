# Agreement flow — implementation and launch checklist

Updated: September 3, 2026

Source of truth: `output/pdf/my-contract-doctors-product-revenue-blueprint.pdf`, especially the Agreement Analysis and Complete Review flows.

## Intended customer flow

1. A visitor chooses **The Agreement** and creates an account or signs in. Authentication returns them to `/agreement`.
2. The customer uploads the complete agreement as a PDF or image from the current device, or scans a 30-minute, one-use QR link and sends the file from a phone. Multi-page paper agreements must be combined into one PDF.
3. Before analysis, the customer provides the email for the result, an optional business name, and a separate optional marketing choice. Marketing is unchecked by default.
4. The server checks ownership, file type, size, rate limit, and allowance, then reads the actual uploaded document. It verifies that every page was covered and rejects a wrong document type.
5. The extraction identifies agreement metadata and actual quoted language for renewal, price increases, termination, minimums, fees, exclusivity, replacement/loss obligations, disputes, and other material provisions.
6. Before any finding appears, the customer sees the vendor, title, dates, page count, document quality, and detected section outline and confirms that the correct document was analyzed.
7. After confirmation, the app shows the exact number of supported findings. Automatic renewal is the stable first free finding when present; price escalation is next in priority. The free finding includes the exact quote, page, plain-English explanation, and an immediate recommended action.
8. The tailored email that asks the vendor to remove or amend that exact provision is paid content. A one-time $49 review unlocks every supported finding and its tailored email. Pro also unlocks the review under its stated allowance.
9. When no responsible finding can be extracted, the page says so plainly and still offers Pro for reviewing other agreements and connecting future invoices. It never pretends that findings are hidden.
10. The result checks saved invoices for the same normalized vendor. Agreement language supplies the rules; invoice records supply actual rates, quantities, fees, and replacements.
11. The combined view creates monitoring checks that fit the evidence: price changes versus escalation language, fees versus permitted-fee language, minimums versus usage, renewal deadlines, and replacement questions such as when a billed floor mat was last replaced.
12. The result email record is enriched with the free-finding category, total and locked finding counts, and linked-invoice count. This supports relevant marketing segments rather than random product suggestions.
13. Checkout keeps the agreement ID and returns the customer to that exact saved result. Access must be granted only by verified payment fulfillment, not by visiting the success page.

## Current implementation status

| Stage | Status | Notes |
| --- | --- | --- |
| Account gate and return path | Ready | Public visitors are directed through sign-up/sign-in and back to the agreement flow. |
| Desktop upload | Ready in code | A complete PDF or one readable image is accepted up to 25 MB. |
| Phone handoff | Ready in code | A random-token, one-use, 30-minute upload sends the file through server storage and desktop polling. A phone-reachable deployment URL and the current migration are required. |
| Email and consent capture | Ready in code | The results email and optional marketing permission are collected before results. The saved lead is enriched after confirmation. |
| Actual-document extraction | Ready in code | The file itself is sent for analysis; business/vendor form fields are no longer used to fabricate a result. |
| Page and document validation | Ready in code | PDF page count is read locally, every page must be reported as reviewed, and non-agreements are rejected. |
| Confirmation gate | Ready in code | Metadata and a section outline are shown before the customer confirms and sees findings. |
| Stable free finding | Ready in code | Renewal is first when present, followed by price escalation. The result always depends on quoted language from the document. |
| Paid clause review and emails | Entitlement-ready | Full findings and clause-specific email templates are server-gated. They become visible only for Pro or an agreement-specific entitlement. |
| Agreement + invoice connection | Ready in code | Same-vendor invoices are linked and the saved result explains the relevant ongoing checks. |
| Zero-finding Pro pitch | Ready in code | The page remains accurate while pitching Pro for more agreements and invoice monitoring. |
| Saved agreement views | Ready in code | New analyses appear in the account agreement list and open their real saved result rather than mock data. |
| Checkout continuity | Preview-ready | The agreement ID survives one-time and Pro checkout previews and returns to the same result. Preview completion does not charge or unlock access. |
| One-time paid entitlement | Not launch-ready | Provider-neutral entitlement storage exists, but verified payment fulfillment and agreement-specific access still need to be connected. |
| Pro billing activation | Staging only | No-charge subscription lifecycle previews are implemented locally. Real activation, renewal, cancellation, refunds, and failed-payment recovery need verified provider events. |
| Marketing provider delivery | Not connected | The consented, segmented lead record is stored; no external email service receives or sends it yet. |
| Longitudinal overcharge detection | Foundation ready | Agreement-to-invoice links and monitoring instructions exist. A scheduled comparison engine and human-confirmed vendor matching are still needed before claiming automated overcharge detection. |
| Replacement history | Foundation only | The result asks the right replacement questions when agreement or invoice evidence supports them. A dated asset/replacement event log is not yet implemented. |

## Evidence and legal-language rules

- Quote only language present in the customer’s uploaded agreement.
- Do not call a provision illegal or unenforceable without jurisdiction-specific legal support.
- Do not claim actual overpayment from an agreement alone; use invoices to establish billed facts.
- Treat the renewal deadline as a calculated aid and tell the customer to verify the contractual delivery method and signed dates.
- Generate the vendor email from the actual clause and business/vendor context only after server-side access is established.
- Keep marketing consent separate, optional, and tied to a recorded consent version.

## Remaining launch sequence

1. Select a payment provider and connect server-created checkout sessions.
2. Verify provider events and grant agreement-specific access for the purchased result; synchronize Pro subscription state.
3. Connect the authorized email-marketing provider and sync only consented leads with their finding and linked-invoice segments.
4. Add a customer confirmation step when vendor-name matching is ambiguous, then compare each new invoice with the applicable agreement clauses and prior invoices.
5. Add renewal alert delivery and a dated replacement/service event record for questions such as when a floor mat was actually replaced.
6. Run a production-like test with a fresh free account, a multi-page known agreement, desktop and real-phone upload, wrong-document rejection, a second blocked free upload, renewal and price-escalation samples, same-vendor invoices, zero-finding copy, and verified payment/refund cases.

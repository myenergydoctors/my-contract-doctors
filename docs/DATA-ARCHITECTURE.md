# My Contract Doctors data architecture

Status: Foundation implemented; extraction evaluation in progress
Last updated: 2026-09-02

## Purpose

My Contract Doctors is an invoice-first analysis product. A customer uploads a
vendor bill, the application extracts it into structured rows, the customer
confirms or corrects those rows, and only then does the application produce
benchmarks, comparable-vendor pricing, and recommendations.

The catalog exists to interpret and compare invoice lines. It is not the source
of truth for what a customer was billed. The reviewed invoice is the source of
truth for analysis.

## Decisions

1. A customer is an organization, not an authentication user.
2. Every separately priced vendor offering is a separate vendor product.
3. Products are never merged across vendors.
4. A vendor's item code is descriptive source data, not a guaranteed unique key.
5. Vendor-specific category trees are preserved and may map to an internal
   cross-vendor category tree.
6. Product attributes are category-dependent. Dimensions are relevant to some
   products; garment sizes, fabric, safety ratings, and other attributes are
   relevant to others.
7. Product comparison is an optional analytical relationship between distinct
   vendor products.
8. Prices belong to dated and scoped price lists, agreements, or invoice lines;
   they do not belong directly to a vendor product.
9. Raw extraction data is immutable. Customer-confirmed values are stored
   separately and every correction is auditable.
10. Analysis is blocked until required invoice data is complete, all red review
    issues are resolved, totals reconcile, and the customer confirms the invoice.
11. A confirmed but unmatched product is valid invoice data. It reduces
    comparison coverage but does not invalidate the invoice.
12. One uploaded file is not assumed to be one document. Classification occurs
    by page range before invoice or agreement processing begins.
13. Free savings previews are generated only from customer-confirmed invoice
    facts. Commerce offers and their prices are separate from vendor products
    and never rewrite the customer's invoice.
14. A customer may confirm that an unidentified charge appears on the invoice
    without identifying it as a product. It remains in totals but is excluded
    from product comparisons and purchase recommendations.
15. AI-observed vendor labels are catalog candidates. Only seed or manually
    approved vendor products may drive reusable matching across customers.

## Evidence from the reference price workbook

The `Homerun Pricing List.xlsx` workbook demonstrates why the model must not
assume one universal catalog format:

- Cintas presents one long list with stock number, description, weekly price,
  and loss/replacement price, plus priceable services without stock numbers.
- U.S. Linen repeats values in its `Mfg/Stock #` column for different products
  and uses continuation rows for colors and descriptions.
- Vestis repeats product codes across sizes and exposes rent, replacement, sale,
  and wash prices along with minimum percentages and service frequencies.
- Each sheet is a dated, regional contract price list rather than a timeless
  global price attached to the product.

The importer must preserve the original sheet, row, code, description, and raw
data even after an item is categorized or matched.

## Conceptual model

```text
Organization
  |-- Organization members --> Auth users / profiles
  |-- Locations
  |-- Vendor relationships --> Vendor
  |-- Agreements -----------> Vendor relationship
  `-- Invoices -------------> Vendor relationship + location
        `-- Invoice lines --> Vendor product (optional until matched)

Document upload
  `-- Page-range segments --> Invoice, agreement, statement, receipt, or other
        |-- Invoice segment --> Invoice analysis
        `-- Agreement segment --> Agreement analysis

Vendor
  |-- Vendor categories --> Internal product category (optional mapping)
  |-- Vendor products ----> Category-dependent attributes
  `-- Price lists ---------> Price-list items and rates

Comparison group
  `-- Members -------------> Separate products from different vendors

Comparison scenario
  |-- Source invoice
  |-- Target vendor / price list
  `-- Scenario lines ------> Source line + target product + estimated cost
```

## Ownership and customer accounts

### `organizations`

Represents the business whose documents and analyses are stored.

| Column | Purpose |
| --- | --- |
| `id` | Stable UUID owner for business records |
| `name` | Customer-facing business name |
| `legal_name` | Optional legal entity name |
| `industry` | Customer industry |
| `status` | `active`, `suspended`, or `closed` |
| `created_at`, `updated_at` | Audit timestamps |

### `organization_members`

Connects users to organizations. Recommended roles are `owner`, `admin`,
`member`, and `viewer`. A user may eventually belong to more than one
organization.

### `locations`

Represents service, billing, or operating locations. Invoices and agreements
may apply to one location, several locations, or the whole organization.

### `organization_vendors`

Represents a customer's relationship with a vendor. Customer account numbers,
local representatives, customer-specific notes, and relationship status belong
here rather than on the global vendor record.

## Vendor catalog

### `vendors`

The existing table remains the stable parent identity for Cintas, UniFirst,
Vestis, U.S. Linen, and other providers. It intentionally contains little data.

### `product_categories`

An internal hierarchical taxonomy used for browsing and cross-vendor analysis.
Examples include `Mats > Scraper Mats`, `Uniforms > Shirts`, and
`Linens > Bed Linen`.

### `vendor_categories`

Preserves a vendor's own category hierarchy. A vendor category may optionally
map to an internal `product_categories` row. The source is recorded as
`vendor`, `imported`, `inferred`, or `manual`.

### `category_attribute_definitions`

Defines the comparison-relevant attributes for an internal category.

| Example category | Example attributes |
| --- | --- |
| Mats | mat type, length, width, material, color, logo/customization |
| Shirts | garment type, sleeve, fabric, fit, size/range, FR rating, visibility class |
| Bedding | bed size, fitted/flat, material, thread count |
| Towels | towel type, material, weight, size |
| Restroom supplies | product type, capacity, package quantity, service model |
| Fees | fee type, calculation method, frequency, triggering condition |

Definitions specify data type, unit family, allowed values, whether the
attribute is required for an exact comparison, and display order.

### `vendor_products`

Each row is one granular, separately priced vendor offering. Two sizes on
separate price-sheet rows remain separate products even if the vendor repeats
the same code.

Common fields:

- `vendor_id`
- `vendor_category_id`
- `product_category_id`
- `vendor_item_code` (nullable and not universally unique)
- `display_name`
- `description`
- `billing_unit`
- `attributes` (`jsonb`, validated using category definitions)
- `source_key` (stable source-specific key when available)
- `is_active`
- provenance and audit timestamps

The database UUID is the product identity. Neither a name nor a vendor code is
the primary identity.

The extraction SKU-memory table now uses a variant-aware `source_key` built from
vendor code plus normalized description. Vendor code remains searchable source
data but is no longer assumed to be unique.

## Document intake and classification

### `document_uploads`

Represents the physical file once, regardless of what it contains. It stores
the private Storage location, media metadata, page count, document quality,
overall detected type and confidence, classifier model/prompt/schema versions,
and the raw classification response.

### `document_segments`

Represents each logical document as a non-overlapping page range. Examples:

- a three-page agreement: one agreement segment, pages 1-3;
- two invoices in one PDF: invoice segments 1-2 and 3-4;
- agreement pages followed by invoices: agreement 1-6, invoice 7, invoice 8,
  with the overall upload classified as `mixed`.

Invoice and agreement analyses reference their upload, source segment, and
exact source page range. Attachments that belong to an agreement remain in its
agreement segment. A new invoice number or separately executed agreement starts
a new segment. Each segment also records whether the printed page sequence is
complete. A visibly missing continuation page is a red review issue that blocks
confirmation; uncertainty is yellow and must be checked against the source.

### `document_classification_corrections`

Append-only history for customer or operator corrections to type and page-range
classification. Only confirmed segment labels enter the frozen classifier
evaluation set.

## Price lists

### `vendor_price_lists`

Stores the context that makes a set of prices meaningful:

- vendor
- name and contract reference
- effective start and end dates
- territory or regions
- scope (`public_contract`, `customer_contract`, `quote`, or `other`)
- optional organization and agreement
- currency
- source document and import metadata
- status and version

### `vendor_price_list_items`

Preserves one source price-sheet row. It may be linked to a vendor product after
matching, but the original code, description, sheet, row, and raw data remain
unchanged.

### `vendor_price_list_rates`

Stores one or more rates for a price-list item. Rate types include `rental`,
`replacement`, `sale`, `wash`, `delivery`, and `other`. Each rate records its
billing basis and service frequency.

Price-list rates use fixed-precision decimal currency amounts rather than
integer cents because contract sheets can contain fractional-cent rates. Final
invoice and scenario totals are rounded to currency cents using an explicit
rounding rule.

## Invoice extraction and review

The existing `invoice_analyses` and `invoice_line_items` tables remain in place
during migration.

### Invoice-level review fields

`invoice_analyses` gains:

- `organization_id`, `location_id`, and `organization_vendor_id`
- `review_status`
- `reviewed_by`, `reviewed_at`
- `review_version`
- printed subtotal and reconciliation difference
- `analysis_ready_at`

Recommended review states:

```text
not_started
needs_review
ready_for_confirmation
confirmed
reopened
```

### Line-level raw and confirmed values

Raw extraction values remain immutable. Confirmed fields are the values used by
analysis:

- source page and row index
- raw code, label, quantity, rate, line total, frequency, and extraction JSON
- confirmed description, quantity, rate, total, frequency, and line type
- vendor product mapping
- mapping confidence and source
- review status, severity, reviewer, and timestamp

Recommended line review states:

```text
needs_review
system_matched
confirmed
customer_corrected
unmatched
excluded
```

### `invoice_review_issues`

Stores individual yellow or red issues rather than flattening them into one
message. Examples include missing amount, unknown code, uncertain frequency,
possible duplicate, unmapped product, or totals mismatch.

### `invoice_line_item_corrections`

Append-only audit history containing field name, previous value, corrected
value, actor, reason, and timestamp.

Customer corrections immediately update the confirmed invoice interpretation.
They may create a catalog-review suggestion, but they do not directly rewrite
shared vendor catalog data.

Invoice transcription and product identity are separate decisions. The
description field means "description as printed" and remains customer-private.
Changing it clears the line's product mapping and sends the proposed correction
to internal review. A customer can instead mark `customer_unsure`; that state is
allowed through confirmation and keeps the amount in invoice and annual-spend
totals while excluding it from comparisons, benchmarks that require a known
product, and product-specific savings offers.

Vendor products carry an explicit catalog status:

```text
candidate -> approved -> reusable matching
          -> rejected -> retained for audit only
```

Extraction may record a candidate observation, but it cannot promote or apply
that candidate. Seeded and manually reviewed mappings are approved. Existing
AI-created rows are treated as candidates and removed from active invoice
product mappings until reviewed.

### Confirmation gate

The server may mark an invoice analysis-ready only when:

1. Vendor and required invoice metadata are present.
2. Every financial line is classified.
3. Every included line has the fields required by its billing basis.
4. No unresolved red review issues remain.
5. Printed and computed totals reconcile within the configured rounding
   tolerance, or the difference is represented by an explicit adjustment line.
6. The customer has confirmed the invoice.

The `Everything looks correct` action confirms all eligible yellow and neutral
rows together. It is unavailable while unresolved red issues exist.

All customer review mutations go through authenticated server endpoints. The
browser does not receive direct write grants to extraction tables.

## Free recommendation and paid unlock

The first post-confirmation experience shows at most one free recommendation.
The initial deterministic rule selects the qualifying floor-mat line with the
largest positive first-year buy-versus-rent savings. A line qualifies only when
its confirmed quantity, line total (or quantity and unit rate), and recurring
billing frequency are available. Missing facts produce no estimate rather than
an inferred value.

The calculation is deliberately open:

```text
annual rental cost = confirmed line total x bills per year
purchase cost      = confirmed quantity x current offer unit price
first-year savings = annual rental cost - purchase cost
later-year savings = annual rental cost
payback weeks      = ceil(purchase cost / annual rental cost x 52)
```

The recommendation is not a cross-vendor benchmark and must not be described
as one. It states that savings begin only if the rental line can be removed
under the customer's agreement and excludes shipping, tax, cleaning,
maintenance, and replacement costs unless those inputs are explicitly added.

The current MVP computes this view from confirmed invoice lines using a
versioned rule (`floor-mat-buy-v1`). It uses a clearly labeled $75-per-mat test
offer and a non-transactional checkout. Before real fulfillment, introduce a
separate `replacement_offers` catalog containing supplier, internal SKU,
eligible product specifications, effective price, inventory state, shipping
rules, return terms, and fulfillment status. It may reference a vendor product
or comparison specification, but it does not belong on the vendor's product
record.

When live offers or multiple recommendation strategies are introduced, store
each displayed result in `invoice_recommendations` with the source line,
algorithm version, copied inputs, offer version, calculation outputs,
assumptions, status, and generation timestamp. This makes an old customer view
reproducible even after an offer price changes.

The conversion order is:

1. Show one invoice-backed opportunity free after confirmation.
2. Offer Pro at $29 per month as the primary way to unlock every finding,
   ongoing invoice reviews, comparisons, and eligible benchmarks.
3. Offer a one-time full invoice analysis as the secondary alternative. Its
   current $49 checkout price is provisional until product pricing is approved.

## Comparisons

### `comparison_groups`

Defines a specific comparable specification, not a shared cross-vendor product.
For example, `3x5 standard scraper mat, weekly rental` is distinct from a 2x5
or 4x6 mat. Category-dependent required attributes define exactness.

### `comparison_group_members`

Links distinct vendor products into a comparison group with:

- match type: `exact`, `equivalent`, or `near_equivalent`
- confidence
- mapping source
- reviewer and confirmation timestamp
- explanation of meaningful differences

Customer-facing cost calculations initially use only confirmed `exact` and
`equivalent` members. Near equivalents may be displayed as alternatives but do
not silently affect totals.

### `comparison_scenarios`

Represents a reproducible estimate for replacing the reviewed source invoice
with a target vendor and price source.

### `comparison_scenario_lines`

Records, for every source invoice line:

- source line and source vendor product
- selected target vendor product and price-list rate
- match type and confidence
- copied quantity, billing basis, and frequency
- calculated target amount and difference
- assumptions and exclusion reason

Scenario headers store current total, projected target total, savings, matched
amount, excluded amount, comparison coverage, and price-source confidence.
Every displayed total must be reproducible from its stored scenario lines.

Flat vendor service charges are retained as granular invoice charges with their
printed amount and billing frequency. Quantity, unit rate, and vendor item code
are optional because these fees are commonly billed as one flat amount. They do
not require a cross-vendor product match. Comparison scenarios include them in
the current bill total but initially record them as excluded from product
substitution with a `benchmark_only_service_fee` reason. They may still be
benchmarked separately by vendor, region, frequency, absolute amount, and share
of current-period charges once the de-identified sample threshold is met.
The review presentation keeps ordinary product and service rows in source order
and places flat service charges last; raw source-page and row provenance remain
unchanged for auditing.

## Security

- Private customer tables carry `organization_id`.
- Row-level security checks active organization membership.
- Global vendor catalog and public price-list data may be readable to signed-in
  customers but is writable only by server/admin workflows.
- Customer-specific price lists remain organization-private.
- Original invoices and agreements remain in private Storage buckets under
  organization-based paths.
- Cross-customer benchmarks are calculated server-side and expose only
  de-identified aggregates that meet a minimum sample threshold.
- No customer can directly change shared catalog mappings.

## Migration plan

The local migration draft is split into independently reviewable phases:

1. `20260831150000_organization_foundation.sql`
2. `20260831151000_vendor_catalog_price_lists.sql`
3. `20260831152000_invoice_review_foundation.sql`
4. `20260831153000_comparison_foundation.sql`
5. `20260831154000_extraction_learning_and_vendor_variants.sql`
6. `20260831155000_document_classification_foundation.sql`
7. `20260831156000_document_classification_revisions.sql`
8. `20260901100000_document_segment_completeness.sql`

They are ordered by dependency. The first seven were applied to the authorized
My Contract Doctors Supabase project on 2026-08-31; the eighth was applied on
2026-09-01 after a linked-project verification and dry run. The invoice-review foundation
passed an isolated database smoke test. The fifth captures improvements found
during the first real Cintas review; the sixth adds page-range classification
for multi-document and mixed-document uploads. The seventh preserves earlier
page classifications while a replacement extraction is being evaluated. The
eighth records missing or uncertain page sequences per logical document.

### Phase 1: additive foundation

- Create organizations, memberships, locations, and organization-vendor links.
- Backfill one organization and owner membership per existing profile.
- Add nullable organization ownership columns to existing private records.
- Create category, attribute-definition, price-list, review-audit, and
  comparison tables.
- Add non-breaking catalog metadata columns.
- Preserve all existing user ownership, RLS, extraction behavior, and legacy
  product mappings.

### Phase 2: invoice review workflow

- Add authenticated server endpoints for corrections and confirmation.
- Write raw and confirmed line values separately.
- Create and resolve review issues.
- Enforce the analysis-ready gate.
- Build the side-by-side invoice preview and review table.

### Phase 3: granular catalog cutover

- Change extraction matching from item-code upsert to stable product identity
  plus candidate matching.
- Import repeated-code and code-less offerings safely.
- Replace `unique(vendor_id, vendor_item_code)` with a variant-aware source key
  built from vendor code plus normalized description.
- Treat the existing `products` taxonomy as legacy until its references are
  migrated to categories and comparison groups.

### Phase 4: price-list import

- Import the reference workbook as source-preserving price-list rows.
- Categorize vendor products and populate attributes.
- Queue uncertain mappings for internal review.

### Phase 5: comparison estimates

- Create and confirm exact/equivalent product groups.
- Select target prices by territory, effective date, and price-source priority.
- Generate auditable line-by-line scenarios and bill-level coverage.

### Phase 6: organization-only ownership

- Update all reads and writes to organization membership checks.
- Move Storage paths to organization ownership.
- Make `organization_id` required where appropriate.
- Retain `user_id` only as creator/uploader attribution where useful.

## Extraction learning loop

The model does not improve merely because a customer edits a line. Improvement
is an explicit, versioned loop:

1. Store the original file, raw model response, model name, prompt version,
   extraction schema version, document-quality rating, and field confidence.
2. Keep raw extracted values separate from customer-confirmed values.
3. Record every changed field in append-only correction history.
4. Promote fully reviewed invoices into an evaluation set only after the
   confirmed lines reconcile to the printed invoice total.
5. Run every proposed prompt, model, OCR, or vendor-pattern change against the
   frozen evaluation set before release.
6. Compare exact field accuracy, line precision/recall, total reconciliation,
   false-red rate, false-yellow rate, and customer correction time.
7. Promote repeated vendor-specific corrections into candidate extraction
   patterns. Patterns become active only after review and repeated success;
   failures reduce their confidence or retire them.
8. Never train on unconfirmed AI output, never let one customer's correction
   silently change another customer's result, and retain rollback by prompt
   and model version.

### Document-quality coverage

The evaluation set must deliberately include:

- Native digital PDFs with clean text and columns.
- High-quality scans and phone photos.
- Skewed, rotated, blurred, shadowed, clipped, or low-contrast pages.
- Multi-page and multi-invoice files.
- Files containing both agreements and invoices, plus multiple logical
  documents of the same type.
- Handwriting, stamps, signatures, and page artifacts.
- Repeated item codes across sizes and descriptions.
- Code-less services, tiered rates, aggregate charges with detailed
  breakdowns, credits, taxes, balances, and unusual fee layouts.
- Missing pages, unreadable totals, duplicated pages, and documents that are
  not invoices.

### Initial real-document baseline (2026-09-01)

The first approved engineering set contains 13 PDFs and 68 physical pages: nine
agreement-only files, three invoice-only files, and one mixed agreement/invoice
file. It contains seven logical invoices. The compact `invoice-v2.3` candidate
correctly routed every physical page after the reviewed ground truth separated
cover memos and quote letters from agreements. The largest invoice files also
returned valid JSON after the extraction response was reduced to facts needed
for customer confirmation; recommendations are deliberately deferred until
after confirmation.

The baseline revealed two invoices whose printed `Page 1 of 2` continuation was
absent. This finding directly produced the segment-completeness gate above. The
evaluated model remains pinned until an alternate model beats this frozen set on
classification, line accuracy, reconciliation, latency, and cost.

## Defaults adopted until changed

- Every source price row is preserved, even when duplicated.
- Every separately priced size or variant is a distinct vendor product.
- Category attributes use a hybrid model: definitions in relational tables and
  values in `jsonb` for flexibility.
- Customer corrections require server validation and append-only audit history.
- Red issues block analysis; yellow issues may be bulk-confirmed.
- Comparison results show a best estimate, coverage, price source, confidence,
  and explicit unmatched amounts.
- No production migration is applied without separately verifying the allowed
  Supabase organization and project identifiers in `docs/PRODUCTION-SCOPE.md`.

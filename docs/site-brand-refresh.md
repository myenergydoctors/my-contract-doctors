# Public site brand refresh

The public site carries the homepage's navy, teal, serif headings, warm backgrounds, and licensed service photography into the rest of the visitor journey. The original service photography is reused in explanatory sections. People-focused header photography is supplied and licensed by the user; the agent does not purchase or license assets.

## Presentation changes

- Pricing: photographic header, a clearer plan introduction, editorial plan layouts, a navy Pro option, accessible billing toggles, explicit annual total, and simpler FAQ dividers.
- Invoice: the account gate becomes a full photographic introduction. The three plain numbered boxes become an ordered process with custom line icons, stronger typography, and consistent spacing.
- Agreement: photographic introduction, a service image alongside the terms being reviewed, editorial feature rows, and a shared process section. Account entry uses the same visual language.
- Supporting pages: About, Contact, Customers and customer stories, Industries and industry detail pages, Reviews, Help, Blog and articles, Demystifier, and Free Guide use the shared header or matching photo treatment.
- Account entry: the shared authentication shell uses licensed service photography and matching colors and typography. Upload workflow progress uses one shared presentation component instead of a second brand navigation bar.

## Shared implementation

`components/marketing/BrandSections.tsx` supplies BrandHero, ProcessSection, DocumentAccountGate, and FlowProgress. Its CSS module keeps the presentation scoped to these public pages. Illustrations are lightweight inline SVG; photography reuses the existing licensed WebP assets. Existing page markup was formatted in touched files, so the diff also contains formatting changes.

## Behavior and scope

Prices, plan entitlements, checkout destinations, invoice/agreement upload and analysis handlers, contact submission, review moderation/publication, and authentication handlers are preserved. The annual price remains $313.20, equivalent to $26.10/month. Existing no-charge checkout previews and existing guide/email delivery behavior are not changed by this presentation work. Dashboard and checkout functionality are outside this visual release.

## Verification

- TypeScript and production build passed.
- Lint has no errors; existing agreement effect and `any` typing warnings remain in legacy page logic.
- Desktop layouts reviewed for pricing, invoice, and agreement; 390px mobile widths checked without page-level horizontal overflow.
- Annual toggle verified to show $26.10/month, $313.20/year, and /checkout/pro-annual.
- Signed-out agreement start verified to reach the account gate with its existing sign-up/sign-in redirects.
- Help and Blog search verified with no-match queries.
- Licensed images and the existing homepage media are reused; no new paid assets or dependencies were added to the project.

## People-focused header revision

The user supplied AdobeStock_2156102197.jpeg on November 1, 2026, showing a baker handling a bread tray while wearing a work uniform and using a towel. The optimized derivative is public/images/people/bakery.webp (1600 × 1067, approximately 144 KB). Shared headers, account-entry photography, and the free-guide background now use this supplied people image instead of product close-ups. Product images remain in the explanatory sections. The generic product-label overlay was removed from headers. A second user-reported download has not yet appeared in Downloads and is awaiting identification.

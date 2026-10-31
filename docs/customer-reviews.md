# Customer reviews - first release

## Routes

- `/dashboard/reviews`: eligible customers submit one review per account, or private feedback, and can withdraw publication consent.
- `/dashboard/admin/reviews`: administrators moderate oldest-first, filter by status, and select homepage testimonials.
- `/reviews`: public, paginated reviews, all published ratings, distribution and overall average.
- `/`: up to three most recent, explicitly selected, published 4- or 5-star testimonials. Hidden until eligible reviews exist.

The dashboard overview and confirmed invoice/agreement result pages prompt eligible users to review. The sidebar links to the review form; admins additionally see Review moderation. The marketing footer and sitemap link to public reviews.

## Verification and privacy

Server authentication uses `getUser()` and canonical active profile state. Submission requires an owned, completed invoice or agreement analysis. Free analyses qualify; browser demo state does not. Database triggers repeat the ownership/completion check. A unique user constraint handles duplicate/racing submissions.

Publication is optional, unchecked initially, and independent of the rating. Private feedback remains visible only to its owner and administrators and is excluded from public ratings. The `reviews-v1` consent wording is:

> I allow My Contract Doctors to publish my rating, review, and chosen display name, role, and business on its website, including selected testimonials. My email and uploaded documents will not be published. I can withdraw permission from this page.

Consent version, timestamp, withdrawal timestamp, and moderation events are retained. Withdrawal removes publication eligibility and homepage selection in one update. Customer-written content and historical consent records cannot be rewritten by moderators. Public rendering selects only display fields; no email, account ID, source analysis ID, or documents are exposed.

Review tables have RLS and no browser policies or grants: access is through server-only service-role helpers after authentication/authorization. Public reads deliberately filter consent and published status and project safe fields. No security-definer functions are introduced.

## Moderation

Every rating starts pending. The queue is oldest-first, with no positive-rating prioritization. Publish genuine negative reviews too. Rejection requires one of: spam, personal/confidential information, abuse/threats, unrelated content, or inauthentic experience. Rating alone is not a rejection reason. A review without current publication consent cannot be published. Homepage featuring additionally requires a published rating of 4 or 5. Public averages include every published rating, not just featured testimonials. The homepage labels its subset as selected and links to all reviews.

Optimistic concurrency uses `updated_at`; stale actions cannot overwrite a newer moderation decision or consent withdrawal. Triggers write an audit event in the same transaction as each submission/change. The queue paginates at 20 reviews; public reviews at 20, with an aggregate that includes rows beyond the API's default row cap.

## Admin provisioning

The migration adds `profiles.is_admin` if absent, defaulting to false, and prevents browser-role writes to it. No existing customer is automatically promoted. The owner explicitly authorized `jesse@myenergydoctors.com`, which has been granted administrator access in the connected MCD database. For future grants, choose the authorized account explicitly and use a trusted database administration path. Never authorize using user-editable auth metadata or demo mode.

## Validation

- `npm run typecheck`
- `node --test tests/customer-reviews.test.ts`: real PostgreSQL/PGlite checks for source verification, duplicate prevention, RLS/grants, consent, moderation, and audit events; validation and safe DTO projection tests.
- `npm test`: full existing suite.
- `npm run build -- --webpack`: production fallback when Turbopack cannot bind its helper port in the local sandbox.
- `REVIEW_AUDIT_PROJECT=xrchncayomnwcnphrwhx node scripts/audit-review-customer-flow.mjs`: opt-in ordinary-customer integration checks against localhost and the explicitly selected project. Creates and cleans disposable users, synthetic analyses and unpublished reviews. No admin privileges are granted by this script.

- `REVIEW_AUDIT_PROJECT=xrchncayomnwcnphrwhx REVIEW_AUDIT_ALLOW_TEMP_ADMIN=yes node scripts/audit-review-moderation-flow.mjs`: explicitly authorized live moderation test with a disposable moderator. Verifies publication of positive and negative reviews, homepage selection, stale-action protection, private-feedback restrictions, policy rejection/republication, and consent withdrawal. Revokes temporary privileges and removes all synthetic reviews/accounts afterward. The temporary admin grant requires specific user authorization before running this script.

The live moderation flow passed with an explicitly authorized disposable administrator. Scheduled email requests/reminders, Google reviews, editing/resubmission, and external review services are outside this release. New public reviews and homepage selections appear on the next page request; no redeployment is required.

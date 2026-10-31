# Renewal reminders and notification delivery

This implementation uses the existing Supabase project and SendGrid integration.
No payment provider or marketing subscription is involved.

## Customer process

- Settings and the portal navigation link to `/dashboard/reminders`.
- Analysis and renewal email choices default off and are saved independently.
  Recipients are always the current verified sign-in address; neither a browser
  request nor a document lead can supply a destination address.
- Pro customers can enable a reminder only for an owned, completed and confirmed
  agreement. They must explicitly verify the non-renewal notice deadline.
  Existing schedules can be disabled after moving to Free.
- Checks use UTC dates and milestones 90, 30, 7, 1 and 0 days before the notice
  deadline. A late enablement creates the current milestone, not a burst of old
  reminders. Passed deadlines do not generate late notices.
- A generation ID changes when the deadline/enabled setting changes. Re-saving
  identical settings keeps it stable. Older pending emails are suppressed and
  older in-app reminders are labeled superseded.
- Every email includes a category-specific unsubscribe link. Opening the web
  page is read-only; confirmation updates the preference. RFC one-click POST is
  also supported. Unsubscribing from renewal mail preserves analysis choices.
  Security/sign-in email behavior is separate.

## Durable delivery

`record_notification_event` transactionally stores the in-app event and its
delivery intent. Stable IDs prevent duplicates and preserve read state. Events
created without opt-in are recorded as suppressed and are not backfilled later.

The server-only queue uses atomic `FOR UPDATE SKIP LOCKED` claims. Workers
recheck account activity, opt-in, current analysis state, Pro eligibility and
current schedule generation/deadline immediately before sending. Pending mail
is suppressed after opt-out, deactivation, schedule changes or lost eligibility.
An already in-flight send can finish; delivered mail cannot be retracted.

Known HTTP 429/5xx failures retry after exponential delays (5 minutes initially),
with five attempts maximum. Permanent provider failures stop. A network outcome
that cannot establish whether SendGrid accepted the message is `uncertain`, not
automatically resent. Interrupted claims become uncertain after ten minutes.

`/dashboard/admin/notification-delivery` lists failed/uncertain jobs. A real
administrator must verify the provider outcome and record a note before marking
sent or allowing retry. The outcome, actor and note are stored transactionally.
Provider custom argument `notification_id` matches the queue job ID.

“Sent” means provider acceptance, not proof of inbox delivery. Inbox acceptance
is separately tested with the owner's authorized QA aliases.

## Scheduling and configuration

`vercel.json` defines:

- Renewal checks: daily at 13:00 UTC, `/api/cron/renewal-reminders`.
- Delivery/retries: every fifteen minutes, `/api/cron/notification-emails`.

Both cron routes fail closed unless the Authorization header exactly matches
the private `CRON_SECRET`. Customers can run an account-scoped check through
`/api/account/notifications/check`, rate-limited to six checks per hour.

Required server configuration:

- Existing Supabase URL/service credentials and SendGrid key.
- `CRON_SECRET`: random private scheduler authentication.
- `NOTIFICATION_SIGNING_SECRET`: separate random unsubscribe signing key.
- `NOTIFICATION_EMAILS_ENABLED=true` for enabled delivery.
- `NOTIFICATION_APP_URL` is optional for local QA; omit it in Vercel so preview
  links use that deployment and production uses the canonical site.

The review branch has preview-scoped secrets and enabled QA delivery. Production
configuration/activation was not authorized by automatic approval review and
has not been performed. Production activation is a launch step: configure the
production secrets, enable delivery, release the compatible application, verify
the Vercel cron jobs are enabled, and inspect the first scheduled runs. Preview
deployments do not run automatic Vercel cron schedules.

## Verification boundaries

- Calendar/milestone/signature/retry tests run offline.
- Real PostgreSQL tests verify transactional events, grants/RLS, claims, stale
  sends and audited admin resolution.
- Opt-in delivery integration uses disposable accounts and a fake transport
  against the allowed real Supabase database. It tests duplicate prevention,
  concurrency, retries/exhaustion, unknown outcomes, consent, deactivation,
  changed/disabled schedules, Pro gating, ownership and CSRF boundaries.
- Global cron handlers are verified with isolated workers. Invoking them against
  all shared-project accounts was blocked by approval review; live QA uses the
  account-scoped check path that calls the same scheduling/delivery functions.
- Browser and actual inbox evidence is recorded separately in
  `output/audit/renewal-email-flow-results.json` after completion.

The additive schema migration is
`supabase/migrations/20261031211458_renewal_notification_delivery.sql` and is
applied only to OSC Web Design / My Contract Doctors (`xrchncayomnwcnphrwhx`).

# Security audit — 2026-08-15

## Scope

- Application: My Contract Doctors
- Supabase organization: OSC Web Design (`mssvratfrcoopldovppa`)
- Supabase project: My Contract Doctors (`xrchncayomnwcnphrwhx`)
- Environment classification: staging, despite the Supabase branch label `Production`
- Explicit exclusion: Honor Pet and every project outside OSC Web Design

## Completed

- Upgraded Next.js to 16.3.1 and reduced the dependency audit to zero known vulnerabilities.
- Added strict response security headers, including CSP and HSTS.
- Added authenticated and anonymous API rate limits backed by an atomic, server-only database function.
- Restricted profile updates to `first_name`, `last_name`, `business_name`, and `industry`.
- Added explicit `WITH CHECK` ownership validation to every client update policy.
- Removed anonymous access to user-owned application tables.
- Removed `TRUNCATE`, `REFERENCES`, `TRIGGER`, and `MAINTAIN` privileges from browser roles.
- Limited client notification updates to the `unread` column.
- Removed API execution rights from trigger and event-trigger helper functions.
- Hardened the auth callback against open redirects.
- Added file size, MIME type, bucket, input, and AI-output validation to extraction endpoints.
- Escaped contact-form HTML and removed provider/configuration details from client errors.
- Disabled unfinished discount redemption in production until a verified billing webhook exists.
- Added server-only boundaries around privileged Supabase clients.

## Applied database migrations

- `20260815190000_security_hardening.sql`
- `20260815191500_least_privilege.sql`

Both migrations are recorded locally and remotely and were verified against the live staging schema after application.

## Verification

- All public application tables have row-level security enabled.
- No anonymous/authenticated direct grants remain on privileged helper functions.
- No INSERT or UPDATE policies remain without an explicit `WITH CHECK` expression.
- Profile update grants expose only the four intended user-editable columns.
- The database-backed rate-limit table and function exist.
- TypeScript, ESLint, and the optimized production build complete successfully.
- `npm audit` reports zero known dependency vulnerabilities.

## Residual items

- Supabase-owned `supabase_admin` default privileges cannot be changed by project migrations. New tables/functions must continue to receive an explicit post-migration privilege audit.
- The live invoice schema is behind the application code and does not yet contain the Phase 2C-1.5 columns. The incompatible diagnostic view was intentionally not deployed.
- Discount-code tables and `profiles.is_admin` are not deployed. Related endpoints remain disabled by feature flags.
- Stripe redemption must remain disabled until a signed, idempotent webhook is implemented and verified.
- Lint has warnings but no errors; these are maintainability/performance cleanup rather than confirmed security vulnerabilities.

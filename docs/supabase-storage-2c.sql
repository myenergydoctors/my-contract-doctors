-- =============================================================
-- My Contract Doctors — Phase 2C-1 Storage bucket setup
--
-- HOW TO RUN:
-- 1. FIRST, create the buckets in the dashboard UI (the SQL approach
--    for bucket creation requires the storage admin role which the
--    SQL Editor doesn't have by default):
--
--    Supabase Dashboard → Storage → New bucket:
--      Name: invoices
--      Public bucket: OFF (must be private)
--      Allowed MIME types: image/png, image/jpeg, image/jpg, image/heic,
--        image/webp, application/pdf
--      Max file size: 25 MB
--    Click Save.
--
--    Then create a second bucket:
--      Name: agreements
--      Public bucket: OFF
--      Allowed MIME types: image/png, image/jpeg, image/jpg, image/heic,
--        image/webp, application/pdf
--      Max file size: 25 MB
--
-- 2. THEN run this SQL to add the RLS policies that let users
--    upload + read files at {user_id}/* paths only:
--    Supabase Dashboard → SQL Editor → + New query → paste → Run
-- =============================================================


-- ─── invoices bucket: per-user folder isolation ──────────────

-- Users can upload files under {their user id}/...
drop policy if exists "Users can upload own invoices" on storage.objects;
create policy "Users can upload own invoices"
on storage.objects
for insert
with check (
  bucket_id = 'invoices'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read files in their own folder
drop policy if exists "Users can read own invoices" on storage.objects;
create policy "Users can read own invoices"
on storage.objects
for select
using (
  bucket_id = 'invoices'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own invoices (e.g., to re-upload)
drop policy if exists "Users can delete own invoices" on storage.objects;
create policy "Users can delete own invoices"
on storage.objects
for delete
using (
  bucket_id = 'invoices'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- ─── agreements bucket: same per-user folder pattern ─────────

drop policy if exists "Users can upload own agreements" on storage.objects;
create policy "Users can upload own agreements"
on storage.objects
for insert
with check (
  bucket_id = 'agreements'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read own agreements" on storage.objects;
create policy "Users can read own agreements"
on storage.objects
for select
using (
  bucket_id = 'agreements'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own agreements" on storage.objects;
create policy "Users can delete own agreements"
on storage.objects
for delete
using (
  bucket_id = 'agreements'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- =============================================================
-- DONE. Verify:
-- 1. Storage → buckets: 'invoices' and 'agreements' visible (private)
-- 2. Storage → Policies: each bucket has 3 policies attached
--    (upload, read, delete — all scoped to the user's own folder)
--
-- Path convention used by the upload code:
--   invoices/{user_id}/{timestamp}-{filename}
--   agreements/{user_id}/{timestamp}-{filename}
--
-- This isolation is enforced at the storage level — even if a bug in
-- our code tried to upload to another user's folder, Supabase rejects it.
-- =============================================================

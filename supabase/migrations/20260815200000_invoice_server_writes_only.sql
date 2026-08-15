-- Deploy together with the server-only extraction writer. Uploaded invoice
-- files and derived extraction records are never writable from the browser.

begin;

revoke insert, update, delete on table public.invoice_analyses from authenticated;
revoke insert, update, delete on table public.invoice_line_items from authenticated;
revoke insert, update, delete on table public.invoice_extraction_jobs from authenticated;

drop policy if exists "Users can insert own invoices" on public.invoice_analyses;
drop policy if exists "Users can update own invoices" on public.invoice_analyses;
drop policy if exists "Users can delete own invoices" on public.invoice_analyses;

drop policy if exists "Users can insert own line items" on public.invoice_line_items;
drop policy if exists "Users can update own line items" on public.invoice_line_items;
drop policy if exists "Users can delete own line items" on public.invoice_line_items;

drop policy if exists "Users can insert own extraction jobs" on public.invoice_extraction_jobs;
drop policy if exists "Users can update own extraction jobs" on public.invoice_extraction_jobs;
drop policy if exists "Users can delete own extraction jobs" on public.invoice_extraction_jobs;

commit;

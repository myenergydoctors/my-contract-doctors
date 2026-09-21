-- Apply with the matching app release: agreement lists now use /api/agreements.
begin;
revoke all on table public.agreement_analyses, public.agreement_entitlements from public, anon, authenticated;
grant all on table public.agreement_analyses, public.agreement_entitlements to service_role;

-- Wrongly classified agreements can also exist in invoice extraction responses.
revoke select on table public.document_uploads, public.invoice_extraction_jobs, public.invoice_analyses from public, anon, authenticated;
do $$
declare target text; cols text;
begin
  foreach target in array array['agreement_analyses','agreement_entitlements','document_uploads','invoice_extraction_jobs','invoice_analyses'] loop
    select string_agg(quote_ident(attname), ', ') into cols
      from pg_attribute where attrelid = ('public.' || target)::regclass and attnum > 0 and not attisdropped;
    execute format('revoke all (%s) on public.%I from public, anon, authenticated', cols, target);
  end loop;
end $$;
grant select (id,invoice_id,status,attempts,started_at,completed_at,error_message,ai_model,
  ai_tokens_input,ai_tokens_output,ai_cost_cents,created_at) on public.invoice_extraction_jobs to authenticated;
grant select (id,user_id,uploaded_at,vendor,invoice_number,invoice_date,status,file_path,
  total_spend_cents,flagged_item_count,period_start,period_end,gross_charges_cents,credits_cents,
  past_balance_cents,late_fees_cents,taxes_cents,total_due_cents,extracted_total_check_cents,
  totals_reconciled,parent_upload_id,sibling_count,sibling_index,state)
  on public.invoice_analyses to authenticated;
-- Existing ownership and active-account RLS policies still restrict these columns.
grant all on table public.document_uploads, public.invoice_extraction_jobs, public.invoice_analyses to service_role;
-- These server-only lead tables were created without service-role grants in the original flow migrations.
grant select, insert, update, delete on table public.invoice_leads, public.agreement_leads, public.agreement_invoice_links to service_role;
commit;

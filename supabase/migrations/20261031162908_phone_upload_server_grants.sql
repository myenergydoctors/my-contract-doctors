-- Phone handoff is mediated by authenticated/token-verified server routes.
-- RLS and the existing browser-role revocations remain in place.
grant select, insert, update on table public.invoice_upload_sessions, public.agreement_upload_sessions to service_role;

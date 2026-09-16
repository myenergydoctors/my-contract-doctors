-- Allow trusted server code to read billing state and maintain provider-backed rows.
-- The service role bypasses RLS, but still needs table privileges.
grant select, insert, update, delete on
  public.billing_subscriptions,
  public.billing_records,
  public.billing_entitlements,
  public.billing_events
to service_role;

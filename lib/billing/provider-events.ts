import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Payment adapters must verify their vendor signature and resolve the account
// owner before calling this function. No public webhook route exists yet.
export type VerifiedBillingEvent = {
  provider: string;
  eventKey: string;
  userId: string;
  kind: "subscription" | "one_time_purchase" | "invoice";
  plan?: "pro" | "pro-annual";
  status?: "trialing" | "active" | "past_due" | "canceled" | "paused" | "paid" | "failed" | "refunded";
  periodStart?: string;
  periodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  productCode?: "agreement" | "invoice-analysis" | "demystifier" | "pro" | "pro-annual";
  resourceId?: string;
  amountCents?: number;
};

export async function applyVerifiedBillingEvent(event: VerifiedBillingEvent) {
  if (!event.provider || event.provider === "staging" || !event.eventKey || !event.userId) {
    throw new Error("A verified provider event is required.");
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("billing_apply_verified_event", {
    p_provider: event.provider, p_event_key: event.eventKey, p_user_id: event.userId,
    p_kind: event.kind, p_plan: event.plan ?? null, p_status: event.status ?? null,
    p_period_start: event.periodStart ?? null, p_period_end: event.periodEnd ?? null,
    p_cancel_at_period_end: event.cancelAtPeriodEnd ?? false,
    p_product_code: event.productCode ?? null, p_resource_id: event.resourceId ?? null,
    p_amount_cents: event.amountCents ?? null,
  });
  if (error) throw error;
  return data;
}

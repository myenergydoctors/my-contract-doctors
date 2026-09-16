import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BillingSnapshot, StagingAction } from "./domain";

// The UI and route use this boundary. A future payment adapter can call the
// same verified billing domain without exposing vendor fields to components.
export interface BillingAdapter {
  command(userId: string, action: StagingAction | "sync", eventKey: string, plan?: string, reason?: string, quantity?: number, listPriceCents?: number): Promise<unknown>;
  snapshot(userId: string): Promise<BillingSnapshot>;
  record(userId: string, recordId: string): Promise<unknown | null>;
}

export const stagingBillingAdapter: BillingAdapter = {
  async command(userId, action, eventKey, plan, reason, quantity, listPriceCents) {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("billing_staging_command", {
      p_user_id: userId, p_action: action, p_plan: plan ?? null,
      p_reason: reason ?? null, p_event_key: eventKey, p_quantity: quantity ?? 1, p_list_price_cents: listPriceCents ?? 0,
    });
    if (error) throw error;
    return data;
  },
  async snapshot(userId) {
    const admin = createAdminClient();
    const [subscription, records, profile] = await Promise.all([
      admin.from("billing_subscriptions").select("user_id,provider,plan,status,current_period_start,current_period_end,scheduled_plan,cancel_at_period_end,cancellation_reason").eq("user_id", userId).maybeSingle(),
      admin.from("billing_records").select("id,record_type,product_code,description,list_price_cents,charged_cents,currency,status,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      admin.from("profiles").select("plan").eq("id", userId).maybeSingle(),
    ]);
    if (subscription.error || records.error || profile.error) throw subscription.error ?? records.error ?? profile.error;
    return { subscription: subscription.data, records: records.data ?? [], profilePlan: profile.data?.plan ?? "free" } as BillingSnapshot;
  },
  async record(userId, recordId) {
    const admin = createAdminClient();
    const { data, error } = await admin.from("billing_records").select("*").eq("user_id", userId).eq("id", recordId).maybeSingle();
    if (error) throw error;
    return data;
  },
};

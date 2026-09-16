export type StagingAction = "checkout" | "switch" | "schedule_free" | "cancel" | "reactivate";
export type BillingStatus = "trialing" | "active" | "past_due" | "canceled" | "paused";
export type BillingSubscription = {
  user_id: string;
  provider: string;
  plan: "pro" | "pro-annual";
  status: BillingStatus;
  current_period_start: string;
  current_period_end: string;
  scheduled_plan: "free" | "pro" | "pro-annual" | null;
  cancel_at_period_end: boolean;
  cancellation_reason: string | null;
};
export type BillingRecord = {
  id: string;
  record_type: string;
  product_code: string;
  description: string;
  list_price_cents: number;
  charged_cents: number;
  currency: string;
  status: string;
  created_at: string;
};
export type BillingSnapshot = { subscription: BillingSubscription | null; records: BillingRecord[]; profilePlan: string };
export const subscriptionPlans = ["pro", "pro-annual"] as const;
export const checkoutProducts = ["pro", "pro-annual", "agreement", "demystifier", "invoice-analysis", "floor-mat"] as const;
export const cancellationReasons = [
  { id: "too_expensive", label: "The price is too high" },
  { id: "not_using", label: "I am not using it enough" },
  { id: "missing_features", label: "It is missing something I need" },
  { id: "other", label: "Another reason" },
] as const;

export function validateStagingCommand(input: unknown): input is { action: StagingAction; plan?: string; reason?: string; quantity?: number; eventKey: string } {
  if (!input || typeof input !== "object") return false;
  const command = input as Record<string, unknown>;
  if (typeof command.eventKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(command.eventKey)) return false;
  if (command.action === "checkout") return typeof command.plan === "string" && checkoutProducts.includes(command.plan as typeof checkoutProducts[number]) && (command.quantity === undefined || (Number.isInteger(command.quantity) && Number(command.quantity) >= 1 && Number(command.quantity) <= 100)) && (command.plan === "floor-mat" || command.quantity === undefined || command.quantity === 1);
  if (command.action === "switch") return typeof command.plan === "string" && subscriptionPlans.includes(command.plan as typeof subscriptionPlans[number]);
  if (command.action === "cancel") return typeof command.reason === "string" && cancellationReasons.some(reason => reason.id === command.reason);
  return command.action === "schedule_free" || command.action === "reactivate";
}

export function describeSubscription(subscription: BillingSubscription | null): string {
  if (!subscription) return "No staging subscription yet";
  if (subscription.status === "canceled") return subscription.provider === "staging" ? "Staging subscription ended" : "Subscription ended";
  if (subscription.cancel_at_period_end) return "Scheduled to end on " + new Date(subscription.current_period_end).toLocaleDateString();
  if (subscription.scheduled_plan === "free") return "Scheduled to move to Free on " + new Date(subscription.current_period_end).toLocaleDateString();
  return (subscription.provider === "staging" ? "Staging period ends " : "Current period ends ") + new Date(subscription.current_period_end).toLocaleDateString();
}

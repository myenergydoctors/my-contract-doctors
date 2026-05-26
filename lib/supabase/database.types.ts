// Type definitions matching the Phase 2B schema (docs/supabase-schema.sql).
// Keep this file in sync if you change the schema — these aren't auto-generated yet.

export type Plan = "free" | "agreement" | "pro" | "pro-annual";

export type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  industry: string | null;
  plan: Plan;
  joined_at: string;
  updated_at: string;
};

export type InvoiceAnalysisRow = {
  id: string;
  user_id: string;
  uploaded_at: string;
  vendor: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  state: string | null;
  zip: string | null;
  total_spend_cents: number | null;
  potential_annual_savings_cents: number | null;
  flagged_item_count: number;
  status: "processing" | "completed" | "failed";
  top_finding: string | null;
  line_items: unknown[];
  file_path: string | null;
  raw_analysis: unknown | null;

  // Phase 2C-1.5 additions
  period_start: string | null;
  period_end: string | null;
  gross_charges_cents: number | null;
  credits_cents: number | null;
  past_balance_cents: number | null;
  late_fees_cents: number | null;
  taxes_cents: number | null;
  total_due_cents: number | null;
  extracted_total_check_cents: number | null;
  totals_reconciled: boolean | null;
  parent_upload_id: string | null;
  sibling_count: number | null;
  sibling_index: number | null;
};

export type AgreementAnalysisRow = {
  id: string;
  user_id: string;
  uploaded_at: string;
  vendor: string | null;
  agreement_name: string | null;
  risk_score: number | null;
  term_length: string | null;
  auto_renewal: string | null;
  top_actions: unknown[];
  clauses: unknown[];
  file_path: string | null;
  raw_analysis: unknown | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: "renewal" | "analysis" | "savings" | "system" | "insight";
  title: string;
  body: string;
  href: string | null;
  action_label: string | null;
  unread: boolean;
  created_at: string;
};

export type SubscriptionRow = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: Plan;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

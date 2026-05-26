// Demo mode controls which user / data state is simulated in the portal.
// Used to preview what the platform looks like at each customer tier without
// real auth + DB. Replace with Supabase session state in Phase 2.

const KEY = "mcd_demo_view_mode";

// "live" = the signed-in user sees their real data (Supabase queries).
// The other 4 are preview overrides for the partner demo — they replace
// real data with mock data filtered to that tier.
export type DemoMode = "live" | "new" | "free" | "agreement" | "pro";

export const demoModes: { id: DemoMode; label: string; description: string }[] = [
  { id: "live",      label: "Live",         description: "Your actual account data. Default for signed-in users." },
  { id: "new",       label: "New user",     description: "Preview: brand new account, no data, free plan. Sees onboarding nudges." },
  { id: "free",      label: "Free plan",    description: "Preview: free user with 1 invoice but limited access. Upgrade prompts visible." },
  { id: "agreement", label: "Agreement",    description: "Preview: paid for one contract analysis. 1 agreement + 1 invoice, limited otherwise." },
  { id: "pro",       label: "Pro plan",     description: "Preview: active Pro subscription. Full access including Industry Insights." },
];

export function getDemoMode(): DemoMode {
  if (typeof window === "undefined") return "live";
  const v = window.localStorage.getItem(KEY) as DemoMode | null;
  if (v === "live" || v === "new" || v === "free" || v === "agreement" || v === "pro") return v;
  // Back-compat with the old 2-state ("populated"/"empty") values
  if (v === ("populated" as unknown as DemoMode)) return "pro";
  if (v === ("empty" as unknown as DemoMode)) return "new";
  return "live"; // default for new users
}

export function setDemoMode(mode: DemoMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, mode);
}

// Plan tier the user is effectively on based on the demo mode.
// For "live" mode, the caller should look up the real plan from the profiles
// table instead — this function returns "free" as a safe default but real
// code should use the user's actual plan when in live mode.
export function planForMode(mode: DemoMode): "free" | "agreement" | "pro" {
  if (mode === "pro") return "pro";
  if (mode === "agreement") return "agreement";
  return "free";
}

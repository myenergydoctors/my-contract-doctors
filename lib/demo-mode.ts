// Demo mode controls which user / data state is simulated in the portal.
// Used to preview what the platform looks like at each customer tier without
// real auth + DB. Replace with Supabase session state in Phase 2.

const KEY = "mcd_demo_view_mode";

export type DemoMode = "new" | "free" | "agreement" | "pro";

export const demoModes: { id: DemoMode; label: string; description: string }[] = [
  { id: "new",       label: "New user",     description: "Brand new account, no data, free plan. Sees onboarding nudges everywhere." },
  { id: "free",      label: "Free plan",    description: "Uploaded one invoice but hasn't paid. Sees 1 free flagged item, rest gated. Upgrade prompts visible." },
  { id: "agreement", label: "Agreement",    description: "Paid $49 for one contract analysis. Has 1 agreement open + 1 invoice with limited access." },
  { id: "pro",       label: "Pro plan",     description: "Active Pro subscription. Full access to everything including Industry Insights." },
];

export function getDemoMode(): DemoMode {
  if (typeof window === "undefined") return "pro";
  const v = window.localStorage.getItem(KEY) as DemoMode | null;
  if (v === "new" || v === "free" || v === "agreement" || v === "pro") return v;
  // Back-compat with the old 2-state ("populated"/"empty") values
  if (v === ("populated" as unknown as DemoMode)) return "pro";
  if (v === ("empty" as unknown as DemoMode)) return "new";
  return "pro";
}

export function setDemoMode(mode: DemoMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, mode);
}

// Plan tier the user is effectively on based on the demo mode
export function planForMode(mode: DemoMode): "free" | "agreement" | "pro" {
  if (mode === "pro") return "pro";
  if (mode === "agreement") return "agreement";
  return "free";
}

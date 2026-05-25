"use client";
import { useEffect, useState } from "react";
import { mockUser } from "./mock-data";
import { getDemoMode } from "./demo-mode";

// Returns the user's effective plan. In "empty" demo mode (i.e. simulating
// a brand-new user), the plan collapses to "free" regardless of what's
// hardcoded on mockUser. Otherwise returns the mockUser's actual plan.
//
// Replace this with a real Supabase-session-derived plan in Phase 2.
export function useEffectivePlan(): string {
  const [plan, setPlan] = useState<string>(mockUser.plan);
  useEffect(() => {
    setPlan(getDemoMode() === "empty" ? "free" : mockUser.plan);
  }, []);
  return plan;
}

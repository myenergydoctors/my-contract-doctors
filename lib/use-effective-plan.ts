"use client";
import { useEffect, useState } from "react";
import { getDemoMode, planForMode, type DemoMode } from "./demo-mode";
import { mockInvoices, mockAgreements, mockNotifications } from "./mock-data";

export function useDemoMode(): DemoMode {
  const [mode, setMode] = useState<DemoMode>("pro");
  useEffect(() => setMode(getDemoMode()), []);
  return mode;
}

export function useEffectivePlan(): "free" | "agreement" | "pro" {
  const mode = useDemoMode();
  return planForMode(mode);
}

// Returns the data the user can see for their current tier. Mirrors the
// real product gating: free users see at most one invoice with one flagged
// item visible; agreement users have one contract analyzed; pro users see
// everything.
export function useEffectiveData() {
  const mode = useDemoMode();
  const plan = planForMode(mode);

  const invoices = (() => {
    if (mode === "new") return [];
    if (mode === "free") return mockInvoices.slice(0, 1);
    if (mode === "agreement") return mockInvoices.slice(0, 1);
    return mockInvoices;
  })();

  const agreements = (() => {
    if (mode === "new" || mode === "free") return [];
    return mockAgreements;
  })();

  const notifications = (() => {
    if (mode === "new") return [];
    if (mode === "free") return mockNotifications.filter(n => n.type === "analysis" || n.type === "system").slice(0, 2);
    if (mode === "agreement") return mockNotifications.filter(n => n.type !== "insight").slice(0, 4);
    return mockNotifications;
  })();

  return { mode, plan, invoices, agreements, notifications };
}

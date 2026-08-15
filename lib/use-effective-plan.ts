"use client";
import { useEffect, useState } from "react";
import { getDemoMode, planForMode, type DemoMode } from "./demo-mode";
import { mockInvoices, mockAgreements, mockNotifications, type InvoiceAnalysis, type AgreementAnalysis } from "./mock-data";
import { listInvoices, type InvoiceForUI } from "./db/invoices";
import { listAgreements, type AgreementForUI } from "./db/agreements";
import { listNotifications, type NotificationForUI } from "./db/notifications";
import { getProfile } from "./db/profiles";
import type { Plan } from "./supabase/database.types";

export function useDemoMode(): DemoMode {
  const [mode, setMode] = useState<DemoMode>("live");
  useEffect(() => setMode(getDemoMode()), []);
  return mode;
}

export function useEffectivePlan(): "free" | "agreement" | "pro" {
  const mode = useDemoMode();
  const [realPlan, setRealPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (mode !== "live") return;
    getProfile().then(p => {
      if (p) setRealPlan(p.plan);
    });
  }, [mode]);

  if (mode === "live") {
    // Treat pro-annual same as pro for feature-gating purposes
    if (realPlan === "pro" || realPlan === "pro-annual") return "pro";
    if (realPlan === "agreement") return "agreement";
    return "free";
  }
  return planForMode(mode);
}

// In live mode, the data shape mirrors what the page expects. Mock data
// already matches; real data goes through adapters in lib/db/* to produce
// the same camelCase shape.
type EffectiveData = {
  mode: DemoMode;
  plan: "free" | "agreement" | "pro";
  invoices: (InvoiceForUI | InvoiceAnalysis)[];
  agreements: (AgreementForUI | AgreementAnalysis)[];
  notifications: (NotificationForUI | typeof mockNotifications[0])[];
  loading: boolean;
};

export function useEffectiveData(): EffectiveData {
  const mode = useDemoMode();
  const [realPlan, setRealPlan] = useState<Plan | null>(null);
  const [realInvoices, setRealInvoices] = useState<InvoiceForUI[]>([]);
  const [realAgreements, setRealAgreements] = useState<AgreementForUI[]>([]);
  const [realNotifications, setRealNotifications] = useState<NotificationForUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mode !== "live") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProfile(),
      listInvoices(),
      listAgreements(),
      listNotifications(),
    ]).then(([profile, invs, agrs, notifs]) => {
      if (cancelled) return;
      setRealPlan(profile?.plan ?? "free");
      setRealInvoices(invs);
      setRealAgreements(agrs);
      setRealNotifications(notifs);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [mode]);

  if (mode === "live") {
    const plan: "free" | "agreement" | "pro" =
      realPlan === "pro" || realPlan === "pro-annual" ? "pro" :
      realPlan === "agreement" ? "agreement" :
      "free";
    return {
      mode,
      plan,
      invoices: realInvoices,
      agreements: realAgreements,
      notifications: realNotifications,
      loading,
    };
  }

  // Preview-tier modes: return mock data filtered for that tier
  const plan = planForMode(mode);
  const invoices =
    mode === "new" ? [] :
    mode === "free" ? mockInvoices.slice(0, 1) :
    mode === "agreement" ? mockInvoices.slice(0, 1) :
    mockInvoices;
  const agreements =
    mode === "new" || mode === "free" ? [] : mockAgreements;
  const notifications =
    mode === "new" ? [] :
    mode === "free" ? mockNotifications.filter(n => n.type === "analysis" || n.type === "system").slice(0, 2) :
    mode === "agreement" ? mockNotifications.filter(n => n.type !== "insight").slice(0, 4) :
    mockNotifications;

  return { mode, plan, invoices, agreements, notifications, loading: false };
}

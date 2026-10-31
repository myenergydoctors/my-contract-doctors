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
  useEffect(() => {
    let cancelled = false;
    if (process.env.NODE_ENV === "development") {
      setMode(getDemoMode());
    } else {
      getProfile().then(profile => {
        if (!cancelled) setMode(profile?.is_admin ? getDemoMode() : "live");
      }).catch(() => { /* Keep real data when tester status cannot be verified. */ });
    }
    return () => { cancelled = true; };
  }, []);
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
  notificationsError: string | null;
  loading: boolean;
};

export function useEffectiveData(): EffectiveData {
  const mode = useDemoMode();
  const [realPlan, setRealPlan] = useState<Plan | null>(null);
  const [realInvoices, setRealInvoices] = useState<InvoiceForUI[]>([]);
  const [realAgreements, setRealAgreements] = useState<AgreementForUI[]>([]);
  const [realNotifications, setRealNotifications] = useState<NotificationForUI[]>([]);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const onRead = (event: Event) => {
      const ids = (event as CustomEvent<string[]>).detail;
      if (Array.isArray(ids)) setRealNotifications(current => current.map(item => ids.includes(item.id) ? { ...item, unread: false } : item));
    };
    const refresh = () => {
      void listNotifications().then(items => { if (!cancelled) { setRealNotifications(items); setNotificationsError(null); } })
        .catch(() => { if (!cancelled) setNotificationsError("Notifications could not be loaded. Please retry."); });
    };
    window.addEventListener("mcd:notifications-read", onRead);
    window.addEventListener("mcd:notifications-refresh", refresh);
    return () => { cancelled = true; window.removeEventListener("mcd:notifications-read", onRead); window.removeEventListener("mcd:notifications-refresh", refresh); };
  }, []);

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
      listNotifications().then(items => ({ items, error: null as string | null })).catch(() => ({ items: [] as NotificationForUI[], error: "Notifications could not be loaded. Please reload and try again." })),
    ]).then(([profile, invs, agrs, notifs]) => {
      if (cancelled) return;
      setRealPlan(profile?.plan ?? "free");
      setRealInvoices(invs);
      setRealAgreements(agrs);
      setRealNotifications(notifs.items);
      setNotificationsError(notifs.error);
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
      notificationsError,
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

  return { mode, plan, invoices, agreements, notifications, notificationsError: null, loading: false };
}

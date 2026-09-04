"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDemoMode, useEffectivePlan } from "@/lib/use-effective-plan";
import type { ServiceReplacementHistoryItem } from "@/lib/db/service-replacement-history-server";

const previewHistory: ServiceReplacementHistoryItem[] = [{
  key: "preview::main facility",
  vendorProductId: "preview",
  productName: "Wall-mounted soap dispenser",
  category: "soap_dispenser",
  categoryLabel: "Soap dispenser",
  facility: "Main facility",
  baseline: { status: "approximately_replaced", replacementDate: "2026-02-01" },
  lastReplacement: {
    date: "2026-06-18",
    precision: "exact",
    quantity: 4,
    source: "facility_manager",
    notes: "Four cracked units replaced in the east restrooms.",
    evidenceFileName: "service-ticket.pdf",
    confirmedAt: "2026-06-20T14:30:00Z",
  },
  billedPeriodsSince: 5,
  ongoingFeesCentsSince: 18750,
  openFollowUps: [],
}];

export default function ServiceHistoryPage() {
  const plan = useEffectivePlan();
  const mode = useDemoMode();
  const [history, setHistory] = useState<ServiceReplacementHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan !== "pro" || mode !== "live") return;
    let cancelled = false;
    fetch("/api/service-history", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load service history.");
        if (!cancelled) setHistory(data.history || []);
      })
      .catch(caught => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load service history."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mode, plan]);

  const displayedHistory = mode === "live" ? history : previewHistory;
  const displayedLoading = mode === "live" && loading;

  if (plan !== "pro") {
    return (
      <div className="max-w-4xl">
        <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-dark p-8 text-white">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">Pro feature</div>
          <h2 className="mt-2 font-serif text-3xl">Service & replacement history</h2>
          <p className="mt-3 max-w-2xl font-sans text-sm font-light leading-6 text-white/70">Keep physical replacement events separate from invoice charges and see how many billed periods have passed since each confirmed replacement.</p>
          <Link href="/checkout/pro" className="mt-6 inline-block rounded-lg bg-teal px-5 py-2.5 font-sans text-sm font-medium text-white no-underline">Upgrade to Pro →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">Pro service history</div>
        <h2 className="mt-1 font-serif text-3xl text-navy">Replacement history</h2>
        <p className="mt-2 max-w-3xl font-sans text-sm font-light leading-6 text-gray-600">Confirmed physical replacements for approved tracked products. Billed-period and ongoing-fee totals are context only; charges never prove whether a replacement happened.</p>
      </div>

      {displayedLoading && <div className="rounded-2xl border border-gray-200 bg-white p-8 font-sans text-sm text-gray-500">Loading service history…</div>}
      {error && <div className="rounded-2xl border border-red/30 bg-red-light p-5 font-sans text-sm text-red">{error}</div>}
      {!displayedLoading && !error && displayedHistory.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <h3 className="font-serif text-xl text-navy">No tracked history yet</h3>
          <p className="mx-auto mt-2 max-w-2xl font-sans text-sm leading-6 text-gray-500">Add history while confirming an invoice. First approve replacement tracking for the relevant catalog item, then open an invoice containing it and choose Replaced, Not replaced, Not sure, or Don’t track.</p>
          <Link href="/dashboard/invoices" className="mt-4 inline-block rounded-lg bg-blue px-4 py-2 font-sans text-sm font-medium text-white no-underline">Open an invoice to add history →</Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {displayedHistory.map(item => (
          <article key={item.key} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 bg-off-white px-5 py-4">
              <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue">{item.categoryLabel}</div>
              <h3 className="mt-1 font-serif text-xl text-navy">{item.productName}</h3>
              <div className="mt-1 font-sans text-xs text-gray-500">{item.facility}</div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Last confirmed replacement" value={formatLastReplacement(item)} />
                <Stat label="Billed periods since" value={String(item.billedPeriodsSince)} />
                <Stat label="Ongoing fees since" value={money(item.ongoingFeesCentsSince)} />
                <Stat label="Quantity last replaced" value={item.lastReplacement?.quantity == null ? "Unknown" : String(item.lastReplacement.quantity)} />
              </div>
              {item.lastReplacement?.notes && <p className="mt-4 rounded-lg bg-blue-pale/30 p-3 font-sans text-xs leading-5 text-gray-700">{item.lastReplacement.notes}</p>}
              <div className="mt-4 flex flex-wrap gap-2 font-sans text-[10px] font-semibold uppercase tracking-wider">
                {item.lastReplacement?.evidenceFileName && <span className="rounded-full bg-teal-light px-2.5 py-1 text-teal">Evidence attached</span>}
                {item.openFollowUps.map(action => <span key={action} className="rounded-full bg-amber/10 px-2.5 py-1 text-amber-700">{action === "ask_vendor" ? "Vendor follow-up open" : "Facility manager task open"}</span>)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-gray-100 p-3"><div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</div><div className="mt-1 font-serif text-lg text-navy">{value}</div></div>;
}

function formatLastReplacement(item: ServiceReplacementHistoryItem): string {
  if (item.lastReplacement) {
    if (!item.lastReplacement.date) return `Date unknown (confirmed ${formatDate(item.lastReplacement.confirmedAt)})`;
    return `${item.lastReplacement.precision === "approximate" ? "About " : ""}${formatDate(item.lastReplacement.date)}`;
  }
  if (item.baseline?.status === "never_replaced") return "Never replaced";
  if (item.baseline?.status === "unknown") return "Unknown";
  if (item.baseline?.replacementDate) return `${item.baseline.status === "approximately_replaced" ? "About " : ""}${formatDate(item.baseline.replacementDate)}`;
  return "No confirmed replacement";
}

function formatDate(value: string): string {
  return new Date(value.includes("T") ? value : `${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function money(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

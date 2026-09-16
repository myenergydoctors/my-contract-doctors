"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cancellationReasons, describeSubscription, type BillingRecord, type BillingSnapshot, type StagingAction } from "@/lib/billing/domain";
import { useDemoMode } from "@/lib/use-effective-plan";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const date = (value: string) => new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export default function BillingPage() {
  const viewMode = useDemoMode();
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [detail, setDetail] = useState<BillingRecord | null>(null);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/billing", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Billing is unavailable.");
      setSnapshot(data as BillingSnapshot);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Billing is unavailable.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  async function command(action: StagingAction, plan?: string, cancellationReason?: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/billing", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, plan, reason: cancellationReason, eventKey: crypto.randomUUID() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Change could not be saved.");
      setSnapshot(data.snapshot as BillingSnapshot);
      setShowCancel(false); setReason("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Change could not be saved."); }
    finally { setBusy(false); }
  }

  async function showRecord(record: BillingRecord) {
    setError("");
    const response = await fetch(`/api/billing/records/${record.id}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Detail is unavailable."); return; }
    setDetail(data.record);
  }

  const subscription = snapshot?.subscription;
  const active = subscription?.status === "active";
  const staging = !subscription || subscription.provider === "staging";
  const pending = Boolean(subscription?.cancel_at_period_end || subscription?.scheduled_plan);
  return <div className="max-w-5xl space-y-8">
    <section className="bg-gradient-to-br from-navy to-navy-dark text-white rounded-2xl p-6 md:p-8">
      <div className="font-sans text-xs uppercase tracking-wider text-blue-light mb-2">Billing and subscription</div>
      <h1 className="font-serif text-3xl mb-3">Your billing preview</h1>
      <p className="font-sans text-sm text-white/80 max-w-2xl">This is a no-charge staging simulation. Staging plans do not change paid access. Your actual account plan is <strong>{snapshot?.profilePlan ?? "loading…"}</strong>.</p>
      {viewMode !== "live" && <p className="font-sans text-sm text-amber-200 mt-3">View as: {viewMode}. Billing below always shows your own account records.</p>}
    </section>

    {error && <div role="alert" className="bg-red-light text-red p-4 rounded-lg text-sm">{error} <button onClick={() => void refresh()} className="underline cursor-pointer">Retry</button></div>}
    {loading ? <div className="text-gray-500">Loading billing records…</div> : snapshot && <>
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="text-xs font-sans uppercase tracking-wider text-blue mb-2">{staging ? "Staging subscription" : "Verified subscription"}</div>
        <h2 className="font-serif text-navy text-2xl mb-2">{active ? subscription?.plan === "pro-annual" ? "Pro annual preview" : "Pro monthly preview" : "No active staging subscription"}</h2>
        <p className="font-sans text-gray-600 text-sm mb-3">{describeSubscription(subscription ?? null)}</p>
        {active && subscription && <p className="font-sans text-gray-600 text-sm mb-5">{staging ? "Current simulated period" : "Current period"}: {date(subscription.current_period_start)} – {date(subscription.current_period_end)}.{staging ? " No renewal or payment is processed automatically in staging." : ""}</p>}
        <div className="flex flex-wrap gap-3">
          {!active && staging && <><Link href="/checkout/pro" className="bg-teal text-white rounded-lg px-4 py-2 text-sm no-underline">Preview Pro monthly</Link><Link href="/checkout/pro-annual" className="bg-navy text-white rounded-lg px-4 py-2 text-sm no-underline">Preview Pro annual</Link></>}
          {active && staging && subscription && <>
            <button disabled={busy} onClick={() => void command("switch", subscription.plan === "pro" ? "pro-annual" : "pro")} className="bg-navy text-white rounded-lg px-4 py-2 text-sm cursor-pointer disabled:opacity-50">Switch to {subscription.plan === "pro" ? "annual" : "monthly"} preview now</button>
            {!pending && <button disabled={busy} onClick={() => void command("schedule_free")} className="border border-gray-300 text-navy rounded-lg px-4 py-2 text-sm cursor-pointer disabled:opacity-50">Schedule move to Free</button>}
            {!pending && <button disabled={busy} onClick={() => setShowCancel(true)} className="border border-red text-red rounded-lg px-4 py-2 text-sm cursor-pointer disabled:opacity-50">Cancel at period end</button>}
            {pending && <button disabled={busy} onClick={() => void command("reactivate")} className="bg-teal text-white rounded-lg px-4 py-2 text-sm cursor-pointer disabled:opacity-50">Keep staging plan</button>}
          </>}
        </div>
        {showCancel && active && <div className="border border-gray-200 rounded-xl p-5 mt-5 max-w-xl">
          <h3 className="font-serif text-navy text-xl mb-2">Cancel staging subscription</h3>
          <p className="text-sm text-gray-600 mb-3">This preview ends on {date(subscription.current_period_end)}. Your saved invoices and agreements remain. In a future paid version, Pro features would end then and saved records would remain available under Free access rules.</p>
          <label htmlFor="cancel-reason" className="block text-sm text-navy font-medium mb-1">Primary reason</label>
          <select id="cancel-reason" value={reason} onChange={event => setReason(event.target.value)} className="border rounded-lg p-2 w-full mb-3"><option value="">Select a reason</option>{cancellationReasons.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
          <p className="text-xs text-gray-500 mb-3">You can switch between monthly and annual preview instead. No discount, pause, or refund is offered in staging.</p>
          <div className="flex gap-2"><button disabled={!reason || busy} onClick={() => void command("cancel", undefined, reason)} className="bg-red text-white rounded-lg px-4 py-2 text-sm disabled:opacity-40 cursor-pointer">Confirm end-of-period cancellation</button><button onClick={() => setShowCancel(false)} className="text-gray-600 text-sm cursor-pointer">Keep plan</button></div>
        </div>}
      </section>
      <section>
        <div className="text-xs font-sans uppercase tracking-wider text-blue mb-3">Other checkout previews</div>
        <div className="flex flex-wrap gap-3"><Link href="/checkout/agreement" className="border bg-white rounded-lg px-4 py-2 text-sm text-navy no-underline">Agreement analysis</Link><Link href="/checkout/invoice-analysis" className="border bg-white rounded-lg px-4 py-2 text-sm text-navy no-underline">Invoice analysis</Link><Link href="/checkout/demystifier" className="border bg-white rounded-lg px-4 py-2 text-sm text-navy no-underline">Demystifier</Link></div>
        <p className="text-xs text-gray-500 mt-2">These previews do not grant one-time product access.</p>
      </section>
      <section>
        <div className="text-xs font-sans uppercase tracking-wider text-blue mb-3">Billing history</div>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {snapshot.records.length === 0 ? <p className="p-5 text-gray-500 text-sm">No billing records yet. Completing a staging checkout will add a no-charge preview here.</p> : snapshot.records.map(record => <button key={record.id} onClick={() => void showRecord(record)} className="w-full flex justify-between items-center gap-4 px-5 py-4 border-b last:border-0 border-gray-100 text-left hover:bg-off-white cursor-pointer">
            <span><span className="block text-navy text-sm">{record.description} · {record.product_code}</span><span className="block text-xs text-gray-500 mt-1">{date(record.created_at)}</span></span>
            <span className="text-right"><span className="block text-teal text-xs font-semibold">{record.status === "no_charge" ? "No charge" : record.status}</span><span className="block text-navy">{money(record.charged_cents)}</span></span>
          </button>)}
        </div>
      </section>
      {detail && <div role="dialog" aria-modal="true" aria-label="Billing record detail" className="fixed inset-0 bg-navy/70 z-50 flex items-center justify-center p-4" onClick={event => { if (event.target === event.currentTarget) setDetail(null); }}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-md"><h2 className="font-serif text-navy text-2xl mb-4">Billing detail</h2>
          <dl className="text-sm space-y-2"><div className="flex justify-between"><dt>Date</dt><dd>{date(detail.created_at)}</dd></div><div className="flex justify-between"><dt>Product</dt><dd>{detail.product_code}</dd></div><div className="flex justify-between"><dt>Listed price</dt><dd>{money(detail.list_price_cents)}</dd></div><div className="flex justify-between font-semibold"><dt>Charged</dt><dd>{money(detail.charged_cents)}</dd></div><div className="flex justify-between"><dt>Status</dt><dd>{detail.status === "no_charge" ? "No charge" : detail.status}</dd></div></dl>
          <p className="text-xs text-gray-500 mt-4">Staging record only. This is not a payment receipt or tax invoice.</p>
          <button onClick={() => setDetail(null)} className="mt-5 bg-navy text-white rounded-lg px-4 py-2 cursor-pointer">Close</button>
        </div>
      </div>}
    </>}
  </div>;
}

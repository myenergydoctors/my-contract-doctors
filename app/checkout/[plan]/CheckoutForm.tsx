"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CheckoutPlan } from "@/lib/checkout-plans";
import Logo from "@/components/Logo";

export default function CheckoutForm({ plan, initialQuantity = 1, invoiceId, agreementId }: { plan: CheckoutPlan; initialQuantity?: number; invoiceId?: string; agreementId?: string }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [eventKey] = useState(() => crypto.randomUUID());
  const estimate = plan.priceCents * quantity;
  const back = invoiceId ? `/dashboard/invoices/${invoiceId}` : agreementId ? `/dashboard/agreements/${agreementId}` : plan.id === "demystifier" ? "/demystifier" : "/pricing";

  async function previewCheckout(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout", plan: plan.id, quantity, eventKey }),
      });
      if (response.status === 401) {
        const checkoutQuery = new URLSearchParams();
        if (invoiceId) checkoutQuery.set("invoice", invoiceId);
        if (agreementId) checkoutQuery.set("agreement", agreementId);
        if (plan.allowQuantity) checkoutQuery.set("quantity", String(quantity));
        const checkoutPath = `/checkout/${plan.id}${checkoutQuery.size ? `?${checkoutQuery}` : ""}`;
        router.push(`/sign-in?redirect=${encodeURIComponent(checkoutPath)}`);
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Preview checkout could not be saved.");
      const recordId = data.result?.recordId;
      if (!recordId) throw new Error("Preview record was not returned. Please check Billing history before retrying.");
      const returnContext = invoiceId ? `&invoice=${encodeURIComponent(invoiceId)}` : agreementId ? `&agreement=${encodeURIComponent(agreementId)}` : "";
      router.push(`/checkout/success?record=${encodeURIComponent(recordId)}${returnContext}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Preview checkout could not be saved.");
      setLoading(false);
    }
  }

  return <div className="min-h-screen bg-off-white">
    <header className="bg-white border-b border-gray-200 px-6 md:px-8 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Logo href="/" variant="light-bg" size="md" />
        <span className="font-sans text-xs font-semibold text-blue">No-charge staging checkout</span>
      </div>
    </header>
    <main className="max-w-5xl mx-auto px-6 md:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      <div>
        <Link href={back} className="font-sans text-sm text-blue no-underline">← Back</Link>
        <h1 className="font-serif text-navy text-3xl mt-5 mb-3">Preview {plan.name}</h1>
        <p className="font-sans text-gray-600 leading-relaxed mb-6">This is a staging simulation. No payment is taken, no subscription or paid entitlement is activated, and no physical order is placed. Sign in to save the preview to your account.</p>
        <form onSubmit={previewCheckout} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">
          {plan.allowQuantity && <div>
            <label htmlFor="quantity" className="block font-sans text-sm font-medium text-navy mb-2">Preview quantity</label>
            <input id="quantity" type="number" min={1} max={100} step={1} value={quantity}
              onChange={event => setQuantity(Math.min(100, Math.max(1, Number.parseInt(event.target.value || "1", 10))))}
              className="w-28 border border-gray-300 rounded-lg px-3 py-2" />
          </div>}
          <div className="bg-blue-pale rounded-lg p-4 text-sm text-navy">Your actual account access remains the same. Staging subscriptions and previews appear in Billing history for testing.</div>
          {error && <div role="alert" className="text-red text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="bg-teal text-white rounded-lg px-5 py-3 font-sans font-medium cursor-pointer disabled:opacity-50">
            {loading ? "Saving preview…" : "Save no-charge checkout preview"}
          </button>
        </form>
      </div>
      <aside className="bg-white border border-gray-200 rounded-2xl p-6 h-fit">
        <div className="font-sans text-xs font-semibold uppercase tracking-wider text-teal mb-3">Preview estimate</div>
        <h2 className="font-serif text-navy text-xl mb-2">{plan.name}</h2>
        <p className="font-sans text-gray-600 text-sm mb-4">{plan.description}</p>
        <div className="flex justify-between font-sans text-sm mb-2"><span>Listed price</span><span>${(estimate / 100).toFixed(2)}</span></div>
        <div className="flex justify-between font-sans text-sm font-semibold text-teal border-t pt-3"><span>Charged today</span><span>$0.00</span></div>
      </aside>
    </main>
  </div>;
}

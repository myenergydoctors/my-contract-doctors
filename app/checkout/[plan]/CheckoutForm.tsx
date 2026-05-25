"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CheckoutPlan } from "@/lib/checkout-plans";
import { validateDiscount, redeemDiscount, type DiscountCode } from "@/lib/discount-codes";
import Logo from "@/components/Logo";

export default function CheckoutForm({ plan }: { plan: CheckoutPlan }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [codeError, setCodeError] = useState("");

  const subtotalCents = plan.priceCents;
  const discountCents = appliedDiscount ? Math.round(subtotalCents * appliedDiscount.discountPct) : 0;
  const totalCents = subtotalCents - discountCents;

  const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const applyCode = () => {
    setCodeError("");
    const result = validateDiscount(codeInput, plan.id);
    if (!result.ok) {
      setCodeError(result.reason);
      setAppliedDiscount(null);
      return;
    }
    setAppliedDiscount(result.discount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mark the discount redeemed BEFORE redirecting so success page reflects it
    if (appliedDiscount) redeemDiscount(appliedDiscount.code);
    // Simulate processing — replace with Stripe in Phase 2
    setTimeout(() => {
      router.push(`/checkout/success?plan=${plan.id}`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-off-white">

      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo href="/" variant="light-bg" size="md" />
          <div className="flex items-center gap-2 font-sans text-xs text-gray-500">
            <span>🔒</span>
            <span>Secure checkout</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">

        {/* Form */}
        <div>
          <Link href="/pricing" className="inline-flex items-center font-sans text-sm text-blue hover:text-navy no-underline mb-4">
            ← Back to pricing
          </Link>
          <h1 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-2">Complete your purchase</h1>
          <p className="font-sans font-light text-gray-500 leading-relaxed mb-8">
            This is a preview checkout. Card details aren't actually charged.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <Field label="Email" placeholder="you@yourbusiness.com" type="email" required />

            {/* Card info */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-3">Card information</div>
              <div className="flex flex-col gap-3">
                <Field label="Card number" placeholder="4242 4242 4242 4242" type="text" required />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiration" placeholder="MM / YY" type="text" required />
                  <Field label="CVC" placeholder="123" type="text" required />
                </div>
                <Field label="Name on card" placeholder="Jane Smith" type="text" required />
              </div>
            </div>

            {/* Billing address */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-3">Billing address</div>
              <div className="flex flex-col gap-3">
                <Field label="Country" defaultValue="United States" type="text" />
                <Field label="Address" placeholder="123 Main St" type="text" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" placeholder="Portland" type="text" />
                  <Field label="ZIP" placeholder="04101" type="text" />
                </div>
              </div>
            </div>

            {/* Discount code */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-3">Discount code</div>
              {appliedDiscount ? (
                <div className="flex justify-between items-center bg-teal-light border border-teal/30 rounded-lg p-3">
                  <div>
                    <div className="font-sans text-sm font-medium text-navy">{appliedDiscount.code}</div>
                    <div className="font-sans text-xs text-teal">{Math.round(appliedDiscount.discountPct * 100)}% off applied</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAppliedDiscount(null); setCodeInput(""); }}
                    className="font-sans text-xs text-gray-500 hover:text-red bg-transparent border-none cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="MCD-PRO-XXXXX"
                    className="flex-1 font-sans text-sm text-navy bg-white rounded-lg px-3.5 py-2.5 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors placeholder:text-gray-400 uppercase tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={applyCode}
                    disabled={!codeInput.trim()}
                    className="font-sans text-sm font-medium bg-navy text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    Apply
                  </button>
                </div>
              )}
              {codeError && <p className="font-sans text-xs text-red mt-2">{codeError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="font-sans text-base font-medium bg-teal text-white py-4 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Processing…" : `Pay ${fmt(totalCents)}`}
            </button>

            <p className="font-sans text-xs text-gray-500 text-center">
              By completing this purchase, you agree to our <Link href="#" className="text-blue hover:text-navy no-underline">Terms</Link> and <Link href="#" className="text-blue hover:text-navy no-underline">Privacy Policy</Link>.
            </p>
          </form>
        </div>

        {/* Summary */}
        <aside>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:sticky lg:top-8">
            <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal mb-3">Order summary</div>
            <h2 className="font-serif text-navy text-xl leading-tight mb-1">{plan.name}</h2>
            <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-5">{plan.description}</p>

            <ul className="flex flex-col gap-2 mb-5 pb-5 border-b border-gray-200">
              {plan.features.map(f => (
                <li key={f} className="flex gap-2 items-start font-sans text-sm text-navy">
                  <span className="text-teal flex-shrink-0">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between items-baseline mb-2">
              <span className="font-sans text-sm text-gray-500">Subtotal</span>
              <span className="font-sans text-navy">{fmt(subtotalCents)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-sans text-sm text-teal">Discount ({appliedDiscount.code})</span>
                <span className="font-sans text-teal">− {fmt(discountCents)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline mb-4 pb-4 border-b border-gray-200">
              <span className="font-sans text-sm text-gray-500">Tax</span>
              <span className="font-sans text-gray-500">Calculated at next step</span>
            </div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-serif text-navy text-lg">Total</span>
              <span className="font-serif text-navy text-2xl">{fmt(totalCents)}</span>
            </div>
            <div className="font-sans text-xs text-gray-500 text-right">{plan.cadence}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, defaultValue, placeholder, type = "text", required }: { label: string; defaultValue?: string; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full font-sans text-sm text-navy bg-white rounded-lg px-3.5 py-2.5 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors placeholder:text-gray-400"
      />
    </div>
  );
}

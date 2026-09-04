import Link from "next/link";
import { getPlan } from "@/lib/checkout-plans";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ plan?: string; quantity?: string; invoice?: string; agreement?: string }> }) {
  const { plan: planId, quantity: rawQuantity, invoice: rawInvoice, agreement: rawAgreement } = await searchParams;
  const plan = planId ? getPlan(planId) : null;
  const invoiceId = rawInvoice && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawInvoice)
    ? rawInvoice
    : null;
  const agreementId = rawAgreement && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawAgreement)
    ? rawAgreement
    : null;
  const redirect = invoiceId ? `/dashboard/invoices/${invoiceId}` : agreementId ? `/dashboard/agreements/${agreementId}` : plan?.postPurchaseRedirect || "/dashboard";
  const quantity = plan?.allowQuantity ? Math.min(100, Math.max(1, Number.parseInt(rawQuantity ?? "1", 10) || 1)) : 1;
  const previewOrder = plan?.fulfillment === "physical-preview";
  const previewCheckout = plan?.checkoutMode === "preview";

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-6 md:px-8 py-12">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 md:p-10 text-center">

        {/* Check */}
        <div className="w-20 h-20 rounded-full bg-teal-light flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#17A882" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <span className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal block mb-3">{previewCheckout ? "Preview complete" : "Payment complete"}</span>
        <h1 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-3">{previewOrder ? "Your test order is ready." : previewCheckout ? "Checkout preview complete." : "You're in."}</h1>
        <p className="font-sans font-light text-gray-500 leading-relaxed mb-6">
          {previewOrder ? (
            <>This demonstrates the drop-ship flow. <strong className="text-navy">No payment was taken and no order was placed.</strong></>
          ) : previewCheckout ? (
            <>This demonstrates the checkout flow. <strong className="text-navy">No payment was taken and no access was activated.</strong></>
          ) : plan ? (
            <>Thanks for purchasing <strong className="text-navy">{plan.name}</strong>. Your access is active now.</>
          ) : (
            <>Your purchase is complete and your access is active.</>
          )}
        </p>

        <div className="bg-off-white border border-gray-200 rounded-xl p-4 mb-6 text-left">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{previewCheckout ? "Preview estimate" : "Receipt"}</div>
          <div className="flex justify-between items-baseline">
            <span className="font-sans text-sm text-navy">{plan?.name || "Purchase"}{plan?.allowQuantity ? ` × ${quantity}` : ""}</span>
            <span className="font-serif text-navy">{plan ? `$${((plan.priceCents * quantity) / 100).toFixed(2)}` : ""}</span>
          </div>
          <div className="font-sans text-xs text-gray-500 mt-1">{previewOrder ? "Supplier, shipping, tax, and live payment will be connected before launch." : previewCheckout ? "Live payment and access activation will be connected before launch." : "A receipt has been sent to your email."}</div>
        </div>

        <Link
          href={redirect}
          className="block font-sans text-base font-medium bg-teal text-white py-3 rounded-lg no-underline hover:opacity-90 transition-opacity"
        >
          {invoiceId ? "Return to this invoice →" : agreementId ? "Return to this agreement →" : previewCheckout ? "Return to dashboard →" : plan?.id === "pro" ? "Go to dashboard →" : plan?.id === "demystifier" ? "Open the Demystifier →" : "Get started →"}
        </Link>

        <Link href="/" className="block mt-4 font-sans text-sm text-gray-500 hover:text-navy no-underline">
          Back to homepage
        </Link>
      </div>
    </div>
  );
}

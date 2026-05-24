import Link from "next/link";
import { getPlan } from "@/lib/checkout-plans";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: planId } = await searchParams;
  const plan = planId ? getPlan(planId) : null;
  const redirect = plan?.postPurchaseRedirect || "/dashboard";

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-6 md:px-8 py-12">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 md:p-10 text-center">

        {/* Check */}
        <div className="w-20 h-20 rounded-full bg-teal-light flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#17A882" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <span className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal block mb-3">Payment complete</span>
        <h1 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-3">You're in.</h1>
        <p className="font-sans font-light text-gray-500 leading-relaxed mb-6">
          {plan ? (
            <>Thanks for purchasing <strong className="text-navy">{plan.name}</strong>. Your access is active now.</>
          ) : (
            <>Your purchase is complete and your access is active.</>
          )}
        </p>

        <div className="bg-off-white border border-gray-200 rounded-xl p-4 mb-6 text-left">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Receipt</div>
          <div className="flex justify-between items-baseline">
            <span className="font-sans text-sm text-navy">{plan?.name || "Purchase"}</span>
            <span className="font-serif text-navy">{plan?.price || ""}</span>
          </div>
          <div className="font-sans text-xs text-gray-500 mt-1">A receipt has been sent to your email.</div>
        </div>

        <Link
          href={redirect}
          className="block font-sans text-base font-medium bg-teal text-white py-3 rounded-lg no-underline hover:opacity-90 transition-opacity"
        >
          {plan?.id === "pro" ? "Go to dashboard →" : plan?.id === "demystifier" ? "Open the Demystifier →" : "Get started →"}
        </Link>

        <Link href="/" className="block mt-4 font-sans text-sm text-gray-500 hover:text-navy no-underline">
          Back to homepage
        </Link>
      </div>
    </div>
  );
}

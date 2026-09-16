import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { stagingBillingAdapter } from "@/lib/billing/server";
import { getPlan } from "@/lib/checkout-plans";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ record?: string; invoice?: string; agreement?: string }> }) {
  const { record: recordId, invoice, agreement } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const validId = recordId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(recordId);
  const record = user && validId ? await stagingBillingAdapter.record(user.id, recordId).catch(() => null) as { record_type: string; product_code: string; list_price_cents: number; charged_cents: number; created_at: string } | null : null;
  const checkout = record?.record_type === "checkout_preview" ? record : null;
  const plan = checkout ? getPlan(checkout.product_code) : null;
  const validResource = (value: string | undefined) => Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
  const returnPath = checkout && validResource(invoice) ? `/dashboard/invoices/${invoice}` : checkout && validResource(agreement) ? `/dashboard/agreements/${agreement}` : "/dashboard/billing";
  return <div className="min-h-screen bg-off-white flex items-center justify-center px-6 py-12">
    <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
      {checkout ? <>
        <div className="font-sans text-xs font-semibold uppercase tracking-wider text-teal mb-3">Preview saved</div>
        <h1 className="font-serif text-navy text-3xl mb-4">No-charge checkout complete</h1>
        <p className="font-sans text-gray-600 mb-5">Your {plan?.name ?? "product"} preview was saved to your account. No payment was taken, no paid access was activated, and no physical order was placed.</p>
        <div className="bg-off-white rounded-lg p-4 text-left text-sm font-sans mb-6">
          <div className="flex justify-between"><span>Listed price</span><span>${(checkout.list_price_cents / 100).toFixed(2)}</span></div>
          <div className="flex justify-between mt-2 font-semibold text-teal"><span>Charged</span><span>${(checkout.charged_cents / 100).toFixed(2)}</span></div>
        </div>
      </> : <>
        <h1 className="font-serif text-navy text-2xl mb-4">Preview record unavailable</h1>
        <p className="font-sans text-gray-600 mb-6">Sign in and check Billing history for a saved preview. A link alone cannot complete checkout.</p>
      </>}
      <Link href="/dashboard/billing" className="block bg-teal text-white rounded-lg px-5 py-3 no-underline">View Billing history</Link>
      {checkout && returnPath !== "/dashboard/billing" && <Link href={returnPath} className="block mt-4 text-sm text-blue no-underline">Return to your saved analysis →</Link>}
    </div>
  </div>;
}

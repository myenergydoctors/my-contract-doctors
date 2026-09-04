import { getPlan } from "@/lib/checkout-plans";
import { notFound } from "next/navigation";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ plan: string }>;
  searchParams: Promise<{ quantity?: string | string[]; invoice?: string | string[]; agreement?: string | string[] }>;
}) {
  const { plan: planId } = await params;
  const query = await searchParams;
  const plan = getPlan(planId);
  if (!plan) notFound();
  const rawQuantity = Array.isArray(query.quantity) ? query.quantity[0] : query.quantity;
  const rawInvoice = Array.isArray(query.invoice) ? query.invoice[0] : query.invoice;
  const rawAgreement = Array.isArray(query.agreement) ? query.agreement[0] : query.agreement;
  const invoiceId = rawInvoice && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawInvoice)
    ? rawInvoice
    : undefined;
  const agreementId = rawAgreement && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawAgreement)
    ? rawAgreement
    : undefined;
  const parsedQuantity = Number.parseInt(rawQuantity ?? "1", 10);
  const quantity = plan.allowQuantity && Number.isFinite(parsedQuantity)
    ? Math.min(100, Math.max(1, parsedQuantity))
    : 1;
  return <CheckoutForm plan={plan} initialQuantity={quantity} invoiceId={invoiceId} agreementId={agreementId} />;
}

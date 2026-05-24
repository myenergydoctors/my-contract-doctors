import { getPlan } from "@/lib/checkout-plans";
import { notFound } from "next/navigation";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan: planId } = await params;
  const plan = getPlan(planId);
  if (!plan) notFound();
  return <CheckoutForm plan={plan} />;
}

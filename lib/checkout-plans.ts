// Checkout plan catalog. Mocked. Replace with Stripe Product IDs in Phase 2.

export type CheckoutPlan = {
  id: string;
  name: string;
  price: string;
  priceCents: number;
  cadence: string;
  description: string;
  features: string[];
  postPurchaseRedirect: string;
};

export const checkoutPlans: Record<string, CheckoutPlan> = {
  pro: {
    id: "pro",
    name: "Pro plan",
    price: "$29.00",
    priceCents: 2900,
    cadence: "billed monthly, cancel anytime",
    description: "Unlimited invoice and contract analyses, plus Industry Insights and auto-renewal alerts.",
    features: [
      "Unlimited invoice analyses",
      "Unlimited contract analyses",
      "Industry Insights dashboard",
      "Auto-renewal alerts",
      "All future modules included",
    ],
    postPurchaseRedirect: "/dashboard",
  },
  agreement: {
    id: "agreement",
    name: "Agreement analysis",
    price: "$49.00",
    priceCents: 4900,
    cadence: "one-time payment",
    description: "A complete, personalized analysis of one specific service agreement.",
    features: [
      "Full clause-by-clause breakdown",
      "Risk score and priority actions",
      "Negotiation email drafts",
      "Lifetime access to that analysis",
    ],
    postPurchaseRedirect: "/agreement",
  },
  demystifier: {
    id: "demystifier",
    name: "The Demystifier",
    price: "$49.99",
    priceCents: 4999,
    cadence: "one-time payment",
    description: "Walk through a real uniform agreement clause-by-clause, with plain-English explanations and ready-to-send negotiation emails.",
    features: [
      "Full clause walkthrough",
      "Plain-English explanations",
      "Risk ratings per clause",
      "Pre-drafted negotiation emails",
      "Lifetime access",
    ],
    postPurchaseRedirect: "/demystifier",
  },
};

export function getPlan(id: string): CheckoutPlan | undefined {
  return checkoutPlans[id];
}

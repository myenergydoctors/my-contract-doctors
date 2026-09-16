// Provider-neutral catalog used for no-charge staging checkout estimates.

export type CheckoutPlan = {
  id: string;
  name: string;
  price: string;
  priceCents: number;
  cadence: string;
  description: string;
  features: string[];
  postPurchaseRedirect: string;
  checkoutMode: "preview" | "live";
  allowQuantity?: boolean;
  fulfillment?: "digital" | "physical-preview";
};

export const checkoutPlans: Record<string, CheckoutPlan> = {
  pro: {
    id: "pro",
    name: "Pro plan",
    price: "$29.00",
    priceCents: 2900,
    cadence: "billed monthly, cancel anytime",
    description: "Ongoing invoice monitoring with defined monthly allowances, saved history, and eligible alerts.",
    features: [
      "Up to 5 new invoice analyses per month",
      "1 agreement analysis credit per quarter",
      "Saved invoice history and monitoring",
      "Auto-renewal alerts",
      "Industry insights where data thresholds are met",
    ],
    postPurchaseRedirect: "/dashboard",
    checkoutMode: "preview",
  },
  "pro-annual": {
    id: "pro-annual",
    name: "Pro plan — annual",
    price: "$348.00",
    priceCents: 34800,
    cadence: "annual preview · no charge",
    description: "Everything in Pro, shown with an annual estimate for staging. No payment is taken.",
    features: [
      "Everything in Pro monthly",
      "Annual listed price: $348 (same as 12 × $29)",
      "One annual staging period",
      "No charge or paid access in staging",
    ],
    postPurchaseRedirect: "/dashboard",
    checkoutMode: "preview",
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
    checkoutMode: "preview",
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
    checkoutMode: "preview",
  },
  "invoice-analysis": {
    id: "invoice-analysis",
    name: "Full invoice analysis",
    price: "$49.00",
    priceCents: 4900,
    cadence: "one-time payment · provisional preview price",
    description: "Unlock every finding, savings estimate, and action step for this invoice without a monthly membership.",
    features: [
      "Every savings opportunity on this invoice",
      "Transparent cost and payback calculations",
      "Recommended next steps",
      "Lifetime access to this invoice analysis",
    ],
    postPurchaseRedirect: "/dashboard/invoices",
    checkoutMode: "preview",
    fulfillment: "digital",
  },
  "floor-mat": {
    id: "floor-mat",
    name: "Commercial replacement floor mat",
    price: "$75.00",
    priceCents: 7500,
    cadence: "per mat · preview price",
    description: "A mocked drop-ship replacement mat offer for testing the savings experience before a supplier is connected.",
    features: [
      "Commercial-grade replacement mat",
      "Drop-shipped to your business",
      "Quantity based on your confirmed invoice",
      "Preview only — no order or payment is placed",
    ],
    postPurchaseRedirect: "/dashboard/invoices",
    checkoutMode: "preview",
    allowQuantity: true,
    fulfillment: "physical-preview",
  },
};

export function getPlan(id: string): CheckoutPlan | undefined {
  return checkoutPlans[id];
}

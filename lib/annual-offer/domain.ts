export const ANNUAL_OFFER_CAMPAIGN = "annual30-v1";
export const ANNUAL_OFFER_COOKIE = "mcd_annual_offer";
export const ANNUAL_OFFER_SEEN = "mcd_annual30_seen_v1";
export const offerSources = [
  "timed",
  "invoice",
  "agreement",
  "paywall",
  "checkout-bump",
] as const;
export type OfferSource = (typeof offerSources)[number];
export type AnnualOfferQuote = {
  listPriceCents: number;
  discountCents: number;
  firstTermPriceCents: number;
  renewalPriceCents: number;
};
export type AnnualOfferStatus = {
  eligible: boolean;
  saved: boolean;
  email?: string;
  requiresSignIn?: boolean;
  quote: AnnualOfferQuote;
};
export function annualOfferQuote(listPriceCents: number): AnnualOfferQuote {
  if (!Number.isSafeInteger(listPriceCents) || listPriceCents < 1)
    throw new Error("Invalid annual price.");
  const discountCents = Math.round((listPriceCents * 30) / 100);
  return {
    listPriceCents,
    discountCents,
    firstTermPriceCents: listPriceCents - discountCents,
    renewalPriceCents: listPriceCents,
  };
}
export function parseOfferCapture(body: unknown): {
  email: string;
  source: OfferSource;
} {
  if (!body || typeof body !== "object")
    throw new Error("Enter a valid email address.");
  const value = body as Record<string, unknown>;
  const email =
    typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email address.");
  if (!offerSources.includes(value.source as OfferSource))
    throw new Error("Invalid offer source.");
  return { email, source: value.source as OfferSource };
}
export function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
export function offerCheckoutPath(
  context: { invoice?: string; agreement?: string } = {},
) {
  const query = new URLSearchParams({ offer: ANNUAL_OFFER_CAMPAIGN });
  const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27,28}$/i;
  if (context.invoice && uuid.test(context.invoice))
    query.set("invoice", context.invoice);
  if (context.agreement && uuid.test(context.agreement))
    query.set("agreement", context.agreement);
  return `/checkout/pro-annual?${query}`;
}

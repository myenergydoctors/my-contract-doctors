import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/checkout-plans";
import {
  annualOfferQuote,
  ANNUAL_OFFER_CAMPAIGN,
  type OfferSource,
} from "./domain";
export type OfferClaim = {
  id: string;
  email: string;
  user_id: string | null;
  status: "reserved" | "redeemed";
};
export const currentAnnualQuote = () =>
  annualOfferQuote(getPlan("pro-annual")!.priceCents);
export function offerSecret() {
  const secret =
    process.env.OFFER_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Offer service unavailable.");
  return secret;
}
export async function annualOfferEligible(user: User): Promise<boolean> {
  const db = createAdminClient();
  const [profile, subscription, paid, usedByAccount, usedByEmail] =
    await Promise.all([
      db
        .from("profiles")
        .select("plan,deactivated_at")
        .eq("id", user.id)
        .maybeSingle(),
      db
        .from("billing_subscriptions")
        .select("provider,status")
        .eq("user_id", user.id)
        .maybeSingle(),
      db
        .from("billing_records")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_code", "pro-annual")
        .eq("status", "paid")
        .limit(1),
      db
        .from("annual_offer_claims")
        .select("id")
        .eq("campaign", ANNUAL_OFFER_CAMPAIGN)
        .eq("status", "redeemed")
        .eq("user_id", user.id)
        .limit(1),
      db
        .from("annual_offer_claims")
        .select("id")
        .eq("campaign", ANNUAL_OFFER_CAMPAIGN)
        .eq("status", "redeemed")
        .eq("email", user.email?.toLowerCase() ?? "")
        .limit(1),
    ]);
  if (
    profile.error ||
    subscription.error ||
    paid.error ||
    usedByAccount.error ||
    usedByEmail.error
  )
    throw new Error("Could not check offer eligibility.");
  return (
    !!profile.data &&
    !profile.data.deactivated_at &&
    !["pro", "pro-annual"].includes(profile.data.plan) &&
    !(
      subscription.data &&
      subscription.data.provider !== "staging" &&
      ["active", "trialing", "past_due"].includes(subscription.data.status)
    ) &&
    !paid.data?.length &&
    !usedByAccount.data?.length &&
    !usedByEmail.data?.length
  );
}
export async function ownedAnnualOffer(
  user: User,
  bind = false,
): Promise<OfferClaim | null> {
  if (
    !user.email ||
    !user.email_confirmed_at ||
    !(await annualOfferEligible(user))
  )
    return null;
  const db = createAdminClient();
  const bound = await db
    .from("annual_offer_claims")
    .select("id,email,user_id,status")
    .eq("campaign", ANNUAL_OFFER_CAMPAIGN)
    .eq("user_id", user.id)
    .maybeSingle();
  if (bound.error) throw new Error("Could not load your offer.");
  const result = bound.data
    ? bound
    : await db
        .from("annual_offer_claims")
        .select("id,email,user_id,status")
        .eq("campaign", ANNUAL_OFFER_CAMPAIGN)
        .eq("email", user.email.toLowerCase())
        .maybeSingle();
  if (result.error) throw new Error("Could not load your offer.");
  const row = result.data as OfferClaim | null;
  if (
    !row ||
    row.status !== "reserved" ||
    (row.user_id && row.user_id !== user.id)
  )
    return null;
  if (bind && !row.user_id) {
    const result = await db
      .from("annual_offer_claims")
      .update({ user_id: user.id })
      .eq("id", row.id)
      .is("user_id", null)
      .select("id")
      .maybeSingle();
    if (result.error || !result.data)
      throw new Error("Could not link this one-time offer to your account.");
    return { ...row, user_id: user.id };
  }
  return row;
}
export async function reserveAnnualOffer(
  email: string,
  source: OfferSource,
  user: User | null,
): Promise<OfferClaim> {
  if (user && (!user.email || user.email.toLowerCase() !== email))
    throw new Error("Use the email address on your signed-in account.");
  if (user && !(await annualOfferEligible(user)))
    throw new Error(
      "This introductory offer is not available for your account.",
    );
  const db = createAdminClient();
  if (user) {
    const existing = await db
      .from("annual_offer_claims")
      .select("id,email,user_id,status")
      .eq("campaign", ANNUAL_OFFER_CAMPAIGN)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing.error) throw new Error("Could not load your offer.");
    if (existing.data) {
      if (existing.data.status !== "reserved")
        throw new Error("Your one-time offer has already been used.");
      return existing.data as OfferClaim;
    }
  }
  const inserted = await db
    .from("annual_offer_claims")
    .upsert(
      { email, source, campaign: ANNUAL_OFFER_CAMPAIGN },
      { onConflict: "campaign,email", ignoreDuplicates: true },
    );
  if (inserted.error)
    throw new Error("Could not save your offer. Please try again.");
  const result = await db
    .from("annual_offer_claims")
    .select("id,email,user_id,status")
    .eq("campaign", ANNUAL_OFFER_CAMPAIGN)
    .eq("email", email)
    .single();
  if (result.error)
    throw new Error("Could not save your offer. Please try again.");
  const row = result.data as OfferClaim;
  if (user) {
    if (row.status !== "reserved" || (row.user_id && row.user_id !== user.id))
      throw new Error("This one-time offer is unavailable.");
    if (user.email_confirmed_at && !row.user_id) {
      const bound = await db
        .from("annual_offer_claims")
        .update({ user_id: user.id })
        .eq("id", row.id)
        .is("user_id", null)
        .select("id")
        .maybeSingle();
      if (bound.error) throw new Error("Your account already has an offer.");
    }
  }
  return row;
}
export async function recordAnnualOfferPreview(
  user: User,
  claim: OfferClaim,
  recordId: string,
) {
  const quote = currentAnnualQuote();
  const { data, error } = await createAdminClient()
    .from("billing_records")
    .update({
      list_price_cents: quote.listPriceCents,
      detail: {
        quantity: 1,
        entitlementCreated: false,
        annualOffer: {
          campaign: ANNUAL_OFFER_CAMPAIGN,
          claimId: claim.id,
          discountPercent: 30,
          firstTermPriceCents: quote.firstTermPriceCents,
          renewalPriceCents: quote.renewalPriceCents,
          discountCents: quote.discountCents,
          term: "first_annual_term_only",
          consumed: false,
        },
      },
    })
    .eq("id", recordId)
    .eq("user_id", user.id)
    .eq("provider", "staging")
    .eq("product_code", "pro-annual")
    .select("id")
    .maybeSingle();
  if (error || !data)
    throw new Error(
      "Could not save the offer estimate. Retry this preview; your offer has not been used.",
    );
}

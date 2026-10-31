import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ANNUAL_OFFER_COOKIE,
  parseOfferCapture,
} from "@/lib/annual-offer/domain";
import {
  annualOfferEligible,
  currentAnnualQuote,
  offerSecret,
  ownedAnnualOffer,
  reserveAnnualOffer,
} from "@/lib/annual-offer/server";
import { signOfferId, verifyOfferCookie } from "@/lib/annual-offer/token";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(req: NextRequest) {
  try {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    const eligible = user ? await annualOfferEligible(user) : true;
    const saved = user
      ? !!(await ownedAnnualOffer(user))
      : !!verifyOfferCookie(
          req.cookies.get(ANNUAL_OFFER_COOKIE)?.value,
          offerSecret(),
        );
    return reply({
      eligible,
      saved,
      email: user?.email,
      requiresSignIn: !user,
      quote: currentAnnualQuote(),
    });
  } catch {
    return reply({ error: "Offer status is temporarily unavailable." }, 503);
  }
}
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== req.nextUrl.origin)
    return reply({ error: "Invalid request origin." }, 403);
  const limit = await checkRateLimit(req, {
    namespace: "annual-offer-capture",
    maxRequests: 5,
    windowSeconds: 900,
  });
  if (!limit.allowed) return rateLimitResponse(limit);
  if (Number(req.headers.get("content-length")) > 4000)
    return reply({ error: "Request too large." }, 413);
  let input;
  try {
    input = parseOfferCapture(await req.json());
  } catch (error) {
    return reply(
      {
        error:
          error instanceof Error
            ? error.message
            : "Enter a valid email address.",
      },
      400,
    );
  }
  try {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    const claim = await reserveAnnualOffer(input.email, input.source, user);
    const response = reply({
      eligible: true,
      saved: true,
      requiresSignIn: !user,
      quote: currentAnnualQuote(),
    });
    response.cookies.set(
      ANNUAL_OFFER_COOKIE,
      signOfferId(claim.id, offerSecret()),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      },
    );
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save your offer.";
    const expected =
      /Use the email|introductory offer|already been used|one-time offer|already has an offer/.test(
        message,
      );
    return reply(
      {
        error: expected
          ? message
          : "Could not save your offer. Please try again.",
      },
      expected ? 409 : 503,
    );
  }
}

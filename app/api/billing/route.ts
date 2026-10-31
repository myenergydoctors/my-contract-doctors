import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stagingBillingAdapter } from "@/lib/billing/server";
import { getPlan } from "@/lib/checkout-plans";
import {
  currentAnnualQuote,
  ownedAnnualOffer,
  recordAnnualOfferPreview,
} from "@/lib/annual-offer/server";
import { validateStagingCommand } from "@/lib/billing/domain";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

async function authenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await authenticatedUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to view billing." },
      { status: 401, headers: noStore },
    );
  try {
    await stagingBillingAdapter.command(user.id, "sync", crypto.randomUUID());
    return NextResponse.json(await stagingBillingAdapter.snapshot(user.id), {
      headers: noStore,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Billing records are unavailable. Apply the billing migration and retry.",
      },
      { status: 503, headers: noStore },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticatedUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to use staging checkout." },
      { status: 401, headers: noStore },
    );
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin)
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403, headers: noStore },
    );
  const body: unknown = await request.json().catch(() => null);
  if (!validateStagingCommand(body))
    return NextResponse.json(
      { error: "Invalid billing action." },
      { status: 400, headers: noStore },
    );
  const annualOffer = (body as typeof body & { annualOffer?: unknown })
    .annualOffer;
  if (annualOffer !== undefined && typeof annualOffer !== "boolean")
    return NextResponse.json(
      { error: "Invalid annual offer." },
      { status: 400, headers: noStore },
    );
  if (annualOffer && (body.action !== "checkout" || body.plan !== "pro-annual"))
    return NextResponse.json(
      { error: "The annual offer applies only to Pro annual checkout." },
      { status: 400, headers: noStore },
    );
  try {
    const claim = annualOffer ? await ownedAnnualOffer(user, true) : null;
    if (annualOffer && !claim)
      return NextResponse.json(
        {
          error:
            "Save your annual offer first and sign in with the same verified email address. The offer may already be used or your account may be ineligible.",
        },
        { status: 409, headers: noStore },
      );
    const listPrice =
      body.action === "checkout"
        ? claim
          ? currentAnnualQuote().firstTermPriceCents
          : getPlan(body.plan!)?.priceCents
        : 0;
    const result = await stagingBillingAdapter.command(
      user.id,
      body.action,
      body.eventKey,
      body.plan,
      body.reason,
      body.quantity,
      listPrice,
    );
    if (claim) {
      const recordId = (result as { recordId?: string })?.recordId;
      if (!recordId) throw new Error("Preview record was not returned.");
      await recordAnnualOfferPreview(user, claim, recordId);
    }
    return NextResponse.json(
      { result, snapshot: await stagingBillingAdapter.snapshot(user.id) },
      { headers: noStore },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save billing change.";
    const expected = /Invalid|No active|Nothing scheduled|Idempotency/.test(
      message,
    );
    return NextResponse.json(
      {
        error: expected
          ? message
          : "Billing change could not be saved. Please retry.",
      },
      { status: expected ? 409 : 503, headers: noStore },
    );
  }
}

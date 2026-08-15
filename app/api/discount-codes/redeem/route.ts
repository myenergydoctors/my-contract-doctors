import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { redeemDiscountCode } from "@/lib/db/discount-codes-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

// Called right after a successful checkout (Stripe webhook territory, once
// Stripe is wired — for now the checkout page calls this itself before
// redirecting to /checkout/success).
export async function POST(req: NextRequest) {
  // Keep redemption disabled until a verified payment webhook can call an
  // atomic database transaction. Browser-initiated redemption is not proof
  // of payment and must never provision a paid entitlement.
  if (process.env.ENABLE_UNSAFE_MOCK_REDEMPTION !== "true" || process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, reason: "Discount redemption is unavailable until secure checkout is enabled." },
      { status: 503 },
    );
  }

  const limit = await checkRateLimit(req, { namespace: "discount-redeem", maxRequests: 5, windowSeconds: 900 });
  if (!limit.allowed) return rateLimitResponse(limit);

  const { code, plan, email } = await req.json();
  if (!code || !plan) return NextResponse.json({ ok: false, reason: "code and plan are required." }, { status: 400 });

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await redeemDiscountCode(code, plan, { userId: user?.id, email });
  if (!result.ok) return NextResponse.json(result, { status: 400 });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { validateDiscountCode } from "@/lib/db/discount-codes-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  if (process.env.ENABLE_DISCOUNT_CODES !== "true") {
    return NextResponse.json({ ok: false, reason: "Discount codes are temporarily unavailable." }, { status: 503 });
  }

  const limit = await checkRateLimit(req, { namespace: "discount-validate", maxRequests: 10, windowSeconds: 900 });
  if (!limit.allowed) return rateLimitResponse(limit);

  const { code, plan, email } = await req.json();
  if (!code || !plan) return NextResponse.json({ ok: false, reason: "code and plan are required." }, { status: 400 });

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await validateDiscountCode(code, plan, { userId: user?.id, email });
  if (!result.ok) return NextResponse.json(result);

  return NextResponse.json({
    ok: true,
    code: result.row.code,
    discountPct: result.row.discount_pct,
  });
}

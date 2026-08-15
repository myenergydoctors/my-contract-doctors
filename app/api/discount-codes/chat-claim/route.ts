import { NextRequest, NextResponse } from "next/server";
import { claimChatDiscountCode } from "@/lib/db/discount-codes-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  if (process.env.ENABLE_DISCOUNT_CODES !== "true") {
    return NextResponse.json({ error: "Discount codes are temporarily unavailable." }, { status: 503 });
  }

  const limit = await checkRateLimit(req, { namespace: "discount-claim", maxRequests: 3, windowSeconds: 3600 });
  if (!limit.allowed) return rateLimitResponse(limit);

  const { anonId } = await req.json();
  if (!anonId || typeof anonId !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(anonId)) {
    return NextResponse.json({ error: "anonId is required." }, { status: 400 });
  }
  const row = await claimChatDiscountCode(anonId);
  return NextResponse.json({ code: row.code, discountPct: row.discount_pct });
}

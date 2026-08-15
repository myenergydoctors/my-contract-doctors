import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, listDiscountCodes, createDiscountCode } from "@/lib/db/discount-codes-server";

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await listDiscountCodes();
  return NextResponse.json({ codes: rows });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { code, plan, discount_pct, max_uses, note, expires_at } = body || {};

  if (!code || typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }
  if (!["pro", "pro-annual", "agreement", "demystifier"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  const pct = Number(discount_pct);
  if (!Number.isFinite(pct) || pct <= 0 || pct > 1) {
    return NextResponse.json({ error: "discount_pct must be between 0 and 1 (e.g. 0.10 for 10%)." }, { status: 400 });
  }
  const uses = max_uses === null || max_uses === undefined || max_uses === "" ? null : Number(max_uses);
  if (uses !== null && (!Number.isInteger(uses) || uses < 1)) {
    return NextResponse.json({ error: "max_uses must be a positive integer or empty for unlimited." }, { status: 400 });
  }

  const result = await createDiscountCode({
    code,
    plan,
    discount_pct: pct,
    max_uses: uses,
    note: note || null,
    expires_at: expires_at || null,
    created_by: admin.id,
  });

  if (result.ok === false) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ code: result.row });
}

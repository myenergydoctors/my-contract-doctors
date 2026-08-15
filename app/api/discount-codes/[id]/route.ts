import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, setDiscountCodeActive } from "@/lib/db/discount-codes-server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  if (typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "active (boolean) is required." }, { status: 400 });
  }

  const result = await setDiscountCodeActive(id, body.active);
  if (result.ok === false) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stagingBillingAdapter } from "@/lib/billing/server";
import { getPlan } from "@/lib/checkout-plans";
import { validateStagingCommand } from "@/lib/billing/domain";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

async function authenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to view billing." }, { status: 401, headers: noStore });
  try {
    await stagingBillingAdapter.command(user.id, "sync", crypto.randomUUID());
    return NextResponse.json(await stagingBillingAdapter.snapshot(user.id), { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Billing records are unavailable. Apply the billing migration and retry." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Sign in to use staging checkout." }, { status: 401, headers: noStore });
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: noStore });
  const body: unknown = await request.json().catch(() => null);
  if (!validateStagingCommand(body)) return NextResponse.json({ error: "Invalid billing action." }, { status: 400, headers: noStore });
  try {
    const result = await stagingBillingAdapter.command(user.id, body.action, body.eventKey, body.plan, body.reason, body.quantity, body.action === "checkout" ? getPlan(body.plan!)?.priceCents : 0);
    return NextResponse.json({ result, snapshot: await stagingBillingAdapter.snapshot(user.id) }, { headers: noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save billing change.";
    const expected = /Invalid|No active|Nothing scheduled|Idempotency/.test(message);
    return NextResponse.json({ error: expected ? message : "Billing change could not be saved. Please retry." }, { status: expected ? 409 : 503, headers: noStore });
  }
}

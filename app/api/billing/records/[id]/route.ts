import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stagingBillingAdapter } from "@/lib/billing/server";

export const dynamic = "force-dynamic";
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view billing details." }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    const record = await stagingBillingAdapter.record(user.id, id);
    return record ? NextResponse.json({ record }, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: "Not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Billing detail is unavailable." }, { status: 503 });
  }
}

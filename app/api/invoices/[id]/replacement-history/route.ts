import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getInvoiceReplacementHistory, ServiceReplacementError } from "@/lib/db/service-replacement-history-server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  try {
    const { id } = await context.params;
    return NextResponse.json({ replacementHistory: await getInvoiceReplacementHistory(id, user.id) });
  } catch (error) {
    if (error instanceof ServiceReplacementError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("Replacement history route failed:", error);
    return NextResponse.json({ error: "Replacement history could not be loaded." }, { status: 500 });
  }
}

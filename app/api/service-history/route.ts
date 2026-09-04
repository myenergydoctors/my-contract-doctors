import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceReplacementHistory, ServiceReplacementError } from "@/lib/db/service-replacement-history-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  try {
    return NextResponse.json({ history: await getServiceReplacementHistory(user.id) });
  } catch (error) {
    if (error instanceof ServiceReplacementError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("Service history route failed:", error);
    return NextResponse.json({ error: "Service history could not be loaded." }, { status: 500 });
  }
}

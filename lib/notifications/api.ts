import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export const privateHeaders = { "Cache-Control": "no-store" };
export async function notificationAccount(request: NextRequest, write = false) {
  if (write && request.headers.get("origin") !== request.nextUrl.origin) return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders }) };
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user?.email_confirmed_at) return { response: NextResponse.json({ error: "Sign in with a verified email." }, { status: 401, headers: privateHeaders }) };
  const { data: active, error } = await client.rpc("account_is_active");
  if (error || !active) return { response: NextResponse.json({ error: "Account access unavailable." }, { status: 403, headers: privateHeaders }) };
  return { user, admin: createAdminClient() };
}
export function notificationError(error: unknown) {
  console.error("Notification operation failed:", error);
  return NextResponse.json({ error: "This notification change could not be completed. Please retry." }, { status: 503, headers: privateHeaders });
}

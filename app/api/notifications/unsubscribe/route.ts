import { NextRequest, NextResponse } from "next/server";
import { readUnsubscribeToken } from "@/lib/notifications/domain";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || (await request.json().catch(() => null))?.token;
  const secret = process.env.NOTIFICATION_SIGNING_SECRET;
  const decoded = secret && readUnsubscribeToken(token, secret);
  if (!decoded) return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("notification_preferences").update({ [decoded.category === "analysis" ? "analysis_email" : "renewal_email"]: false, updated_at: new Date().toISOString() }).eq("user_id", decoded.userId);
  if (error) return NextResponse.json({ error: "Unsubscribe could not be saved. Please retry." }, { status: 503 });
  const suppressed = await admin.from("notification_email_jobs").update({ status: "suppressed", last_error: "Unsubscribed" }).eq("user_id", decoded.userId).eq("category", decoded.category).eq("status", "pending");
  if (suppressed.error) return NextResponse.json({ error: "Unsubscribe saved; queued delivery cleanup needs retry." }, { status: 503 });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

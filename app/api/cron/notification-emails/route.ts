import { NextRequest, NextResponse } from "next/server";
import { validCronAuth, cronUserScope } from "@/lib/notifications/cron";
import { deliverNotificationEmails } from "@/lib/notifications/server";
export const maxDuration = 300;
export async function GET(request: NextRequest) {
  if (!validCronAuth(request.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let userId; try { userId = cronUserScope(request.nextUrl); } catch { return NextResponse.json({ error: "Invalid account scope" }, { status: 400 }); }
  try { const result = await deliverNotificationEmails(userId); return NextResponse.json(result, { status: result.configured ? 200 : 503, headers: { "Cache-Control": "no-store" } }); }
  catch (error) { console.error("Email delivery cron failed:", error); return NextResponse.json({ error: "Email delivery unavailable" }, { status: 503 }); }
}

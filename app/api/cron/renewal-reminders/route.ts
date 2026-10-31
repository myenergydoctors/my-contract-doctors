import { NextRequest, NextResponse } from "next/server";
import { validCronAuth } from "@/lib/notifications/cron";
import { scheduleRenewalReminders } from "@/lib/notifications/server";
export const maxDuration = 300;
export async function GET(request: NextRequest) {
  if (!validCronAuth(request.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await scheduleRenewalReminders(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { console.error("Renewal cron failed:", error); return NextResponse.json({ error: "Renewal scheduling failed" }, { status: 503 }); }
}

import { NextRequest, NextResponse } from "next/server";
import { notificationAccount, notificationError, privateHeaders } from "@/lib/notifications/api";
import { scheduleRenewalReminders, deliverNotificationEmails } from "@/lib/notifications/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
export async function POST(request: NextRequest) {
  const access = await notificationAccount(request, true); if (access.response) return access.response;
  const limit = await checkRateLimit(request, { namespace: "notification-check", identity: access.user!.id, maxRequests: 6, windowSeconds: 3600 });
  if (!limit.allowed) return rateLimitResponse(limit);
  try {
    return NextResponse.json({ reminders: await scheduleRenewalReminders(access.user!.id), emails: await deliverNotificationEmails(access.user!.id) }, { headers: privateHeaders });
  } catch (error) { return notificationError(error); }
}

import { NextRequest, NextResponse } from "next/server";
import { notificationAccount, notificationError, privateHeaders } from "@/lib/notifications/api";
export async function POST(request: NextRequest) {
  const access = await notificationAccount(request, true); if (access.response) return access.response;
  const input = await request.json().catch(() => null);
  if (typeof input?.analysisEmail !== "boolean" || typeof input?.renewalEmail !== "boolean") return NextResponse.json({ error: "Choose your email preferences." }, { status: 400 });
  try {
    const { error } = await access.admin.from("notification_preferences").upsert({ user_id: access.user!.id, analysis_email: input.analysisEmail, renewal_email: input.renewalEmail, updated_at: new Date().toISOString() });
    if (error) throw error;
    for (const category of ["analysis", "renewal"] as const) if (!input[category === "analysis" ? "analysisEmail" : "renewalEmail"]) {
      const suppressed = await access.admin.from("notification_email_jobs").update({ status: "suppressed", last_error: "Email preference disabled" }).eq("user_id", access.user!.id).eq("category", category).eq("status", "pending");
      if (suppressed.error) throw suppressed.error;
    }
    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch (error) { return notificationError(error); }
}

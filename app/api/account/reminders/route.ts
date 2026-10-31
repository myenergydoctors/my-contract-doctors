import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { notificationAccount, notificationError, privateHeaders } from "@/lib/notifications/api";
import { validDate } from "@/lib/notifications/domain";
export async function GET(request: NextRequest) {
  const access = await notificationAccount(request); if (access.response) return access.response;
  try {
    const id = access.user!.id, admin = access.admin!;
    const [profile, preferences, agreements, schedules, deliveries] = await Promise.all([
      admin.from("profiles").select("plan,is_admin").eq("id", id).single(),
      admin.from("notification_preferences").select("analysis_email,renewal_email").eq("user_id", id).maybeSingle(),
      admin.from("agreement_analyses").select("id,agreement_name,vendor,renewal_deadline,expiration_date,review_status,status").eq("user_id", id).order("uploaded_at", { ascending: false }),
      admin.from("agreement_reminder_settings").select("agreement_id,notice_deadline,enabled,confirmed_at").eq("user_id", id),
      admin.from("notification_email_jobs").select("status,created_at,sent_at,category,attempts").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
    ]);
    for (const result of [profile, preferences, agreements, schedules, deliveries]) if (result.error) throw result.error;
    return NextResponse.json({ pro: ["pro", "pro-annual"].includes(profile.data!.plan), administrator: !!profile.data!.is_admin,
      emailDeliveryConfigured: process.env.NOTIFICATION_EMAILS_ENABLED === "true" && !!process.env.SENDGRID_API_KEY && !!process.env.NOTIFICATION_SIGNING_SECRET,
      automaticChecksConfigured: process.env.VERCEL_ENV === "production" && !!process.env.CRON_SECRET,
      preferences: preferences.data ?? { analysis_email: false, renewal_email: false }, agreements: agreements.data, schedules: schedules.data, deliveries: deliveries.data }, { headers: privateHeaders });
  } catch (error) { return notificationError(error); }
}
export async function POST(request: NextRequest) {
  const access = await notificationAccount(request, true); if (access.response) return access.response;
  const input = await request.json().catch(() => null);
  if (!/^[a-f0-9-]{36}$/i.test(input?.agreementId ?? "") || !validDate(input?.noticeDeadline) || typeof input?.enabled !== "boolean") return NextResponse.json({ error: "Choose an agreement and a valid notice deadline." }, { status: 400 });
  try {
    const admin = access.admin!, id = access.user!.id;
    const [profile, agreement, previous] = await Promise.all([
      admin.from("profiles").select("plan").eq("id", id).single(),
      admin.from("agreement_analyses").select("id,status,review_status").eq("id", input.agreementId).eq("user_id", id).maybeSingle(),
      admin.from("agreement_reminder_settings").select("notice_deadline,enabled,generation").eq("agreement_id", input.agreementId).eq("user_id", id).maybeSingle(),
    ]);
    if (profile.error || agreement.error || previous.error) throw new Error("Reminder eligibility unavailable.");
    if (!agreement.data) return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
    if (input.enabled && (!["pro", "pro-annual"].includes(profile.data!.plan) || agreement.data.status !== "completed" || agreement.data.review_status !== "confirmed")) return NextResponse.json({ error: "Renewal monitoring requires Pro and a confirmed agreement." }, { status: 403 });
    if (input.enabled && input.noticeDeadline < new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: "This deadline has passed. Confirm a future deadline before enabling reminders." }, { status: 400 });
    if (previous.data?.notice_deadline === input.noticeDeadline && previous.data.enabled === input.enabled) return NextResponse.json({ ok: true });
    const { error } = await admin.from("agreement_reminder_settings").upsert({ agreement_id: input.agreementId, user_id: id, notice_deadline: input.noticeDeadline, enabled: input.enabled, generation: randomUUID(), confirmed_at: new Date().toISOString() });
    if (error) throw error;
    const oldJobs = await admin.from("notification_email_jobs").select("id").eq("user_id", id).eq("category", "renewal").contains("context", { agreementId: input.agreementId, generation: previous.data?.generation ?? "none" });
    if (oldJobs.error) throw oldJobs.error;
    const ids = (oldJobs.data ?? []).map(row => row.id);
    if (ids.length) {
      const [jobs, events] = await Promise.all([
        admin.from("notification_email_jobs").update({ status: "suppressed", last_error: "Renewal schedule changed" }).in("id", ids).eq("status", "pending"),
        admin.from("notifications").update({ title: "Renewal reminder superseded", body: "The deadline or reminder setting changed. Open reminder settings for the current dates.", unread: false }).in("id", ids).eq("user_id", id),
      ]);
      if (jobs.error || events.error) throw new Error("Old reminder status could not be refreshed.");
    }
    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch (error) { return notificationError(error); }
}

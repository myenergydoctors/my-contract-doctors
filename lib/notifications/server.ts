import "server-only";
import sgMail from "@sendgrid/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE } from "@/lib/site";
import { deliveryFailure, dueReminder, eventId, unsubscribeToken, type EmailCategory } from "./domain";

type Job = { id: string; user_id: string; category: EmailCategory; attempts: number; claim_token: string; context: { agreementId?: string; generation?: string; deadline?: string; kind?: string; analysisId?: string; status?: string } };
export function notificationOrigin() {
  const origin = new URL(process.env.NOTIFICATION_APP_URL || (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : SITE.url));
  const permitted = new Set([new URL(SITE.url).origin, ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [])]);
  const local = !process.env.VERCEL_ENV && ["localhost", "127.0.0.1"].includes(origin.hostname) && origin.protocol === "http:";
  if (!permitted.has(origin.origin) && !local) throw new Error("Notification link origin is unavailable before send.");
  return origin.origin;
}
export async function recordEvent(event: { id: string; user_id: string; type: string; title: string; body: string; href: string; action_label: string }, category: EmailCategory, context = {}, admin = createAdminClient()) {
  const { error } = await admin.rpc("record_notification_event", { p_event: event, p_category: category, p_context: context });
  if (error) throw new Error("Notification event could not be saved.");
}
export async function scheduleRenewalReminders(userId?: string, now = new Date(), admin = createAdminClient()) {
  let queued = 0, evaluated = 0, cursor = "";
  while (true) {
  let query = admin.from("agreement_reminder_settings").select("agreement_id,user_id,notice_deadline,generation").eq("enabled", true)
    .gte("notice_deadline", now.toISOString().slice(0, 10)).lte("notice_deadline", new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10)).order("agreement_id").limit(200);
  if (userId) query = query.eq("user_id", userId);
  if (cursor) query = query.gt("agreement_id", cursor);
  const { data, error } = await query;
  if (error) throw new Error("Renewal schedules could not be loaded.");
  if (!data?.length) break;
  evaluated += data.length;
  const [profiles, agreements] = await Promise.all([
    admin.from("profiles").select("id,plan,deactivated_at").in("id", [...new Set(data.map(row => row.user_id))]),
    admin.from("agreement_analyses").select("id,user_id").in("id", data.map(row => row.agreement_id)).eq("review_status", "confirmed").eq("status", "completed"),
  ]);
  if (profiles.error || agreements.error) throw new Error("Reminder eligibility could not be checked.");
  for (const schedule of data ?? []) {
    const due = dueReminder(schedule.notice_deadline, now);
    if (!due) continue;
    const profile = profiles.data?.find(row => row.id === schedule.user_id);
    if (!profile || profile.deactivated_at || !["pro", "pro-annual"].includes(profile.plan) || !agreements.data?.some(row => row.id === schedule.agreement_id && row.user_id === schedule.user_id)) continue;
    const id = eventId(`renewal:${schedule.user_id}:${schedule.agreement_id}:${schedule.generation}:${due.lead}`);
    await recordEvent({ id, user_id: schedule.user_id, type: "renewal", title: `Agreement notice deadline: ${schedule.notice_deadline}`,
      body: `Your confirmed non-renewal notice deadline is ${schedule.notice_deadline}. Review the agreement's delivery requirements and source wording before taking action. This is a reminder, not legal advice or a notice sent to your vendor.`,
      href: "/dashboard/reminders", action_label: "Review reminder settings" }, "renewal", { agreementId: schedule.agreement_id, generation: schedule.generation, deadline: schedule.notice_deadline }, admin);
    queued++;
  }
  if (data.length < 200) break;
  cursor = data[data.length - 1].agreement_id;
  }
  return { evaluated, due: queued };
}

export async function deliverNotificationEmails(userId?: string, admin = createAdminClient(), send = sgMail.send.bind(sgMail)) {
  if (process.env.NOTIFICATION_EMAILS_ENABLED !== "true" || !process.env.SENDGRID_API_KEY || !process.env.NOTIFICATION_SIGNING_SECRET) {
    return { configured: false, sent: 0, suppressed: 0, retrying: 0, failed: 0, uncertain: 0 };
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const { data, error } = await admin.rpc("claim_notification_email_jobs", { p_user_id: userId ?? null, p_limit: 20 });
  if (error) throw new Error("Email delivery queue could not be claimed.");
  const result = { configured: true, sent: 0, suppressed: 0, retrying: 0, failed: 0, uncertain: 0 };
  for (const job of (data ?? []) as Job[]) {
    let providerAccepted = false;
    const finish = async (values: Record<string, unknown>) => {
      const saved = await admin.from("notification_email_jobs").update(values).eq("id", job.id).eq("claim_token", job.claim_token).eq("status", "sending").select("id");
      if (saved.error || saved.data?.length !== 1) throw new Error("Delivery completion could not be recorded.");
    };
    try {
      const [profile, preferences, account, notification] = await Promise.all([
        admin.from("profiles").select("plan,deactivated_at").eq("id", job.user_id).maybeSingle(),
        admin.from("notification_preferences").select("analysis_email,renewal_email").eq("user_id", job.user_id).maybeSingle(),
        admin.auth.admin.getUserById(job.user_id),
        admin.from("notifications").select("title,body,href").eq("id", job.id).eq("user_id", job.user_id).maybeSingle(),
      ]);
      if (profile.error || preferences.error || account.error || notification.error) throw new Error("Email eligibility lookup failed before send.");
      let allowed = !!profile.data && !profile.data.deactivated_at && !!account.data.user?.email_confirmed_at && !!account.data.user?.email && !!notification.data
        && !!preferences.data?.[job.category === "analysis" ? "analysis_email" : "renewal_email"];
      if (allowed && job.category === "renewal") {
        const [schedule, agreement] = await Promise.all([
          admin.from("agreement_reminder_settings").select("generation,enabled,notice_deadline").eq("agreement_id", job.context.agreementId).eq("user_id", job.user_id).maybeSingle(),
          admin.from("agreement_analyses").select("status,review_status").eq("id", job.context.agreementId).eq("user_id", job.user_id).maybeSingle(),
        ]);
        if (schedule.error || agreement.error) throw new Error("Renewal eligibility lookup failed before send.");
        allowed = Boolean(["pro", "pro-annual"].includes(profile.data!.plan) && schedule.data?.enabled && schedule.data.generation === job.context.generation && schedule.data.notice_deadline === job.context.deadline && dueReminder(schedule.data.notice_deadline) && agreement.data?.status === "completed" && agreement.data?.review_status === "confirmed");
      }
      if (allowed && job.category === "analysis" && job.context.analysisId) {
        const analysis = await admin.from(job.context.kind === "invoice" ? "invoice_analyses" : "agreement_analyses").select("status").eq("id", job.context.analysisId).eq("user_id", job.user_id).maybeSingle();
        if (analysis.error) throw new Error("Analysis eligibility lookup failed before send.");
        allowed = analysis.data?.status === (job.context.status === "ready" ? "completed" : "failed");
      }
      if (!allowed) { await finish({ status: "suppressed", last_error: "Preference, account or schedule no longer eligible" }); result.suppressed++; continue; }
      const origin = notificationOrigin();
      const unsubscribe = `${origin}/notifications/unsubscribe?token=${unsubscribeToken(job.user_id, job.category, process.env.NOTIFICATION_SIGNING_SECRET!)}`;
      const target = new URL(notification.data!.href?.startsWith("/dashboard") ? notification.data!.href : "/dashboard/notifications", origin);
      const response = await send({ to: account.data.user!.email!, from: SITE.emailFrom, subject: `${notification.data!.title} — My Contract Doctors`,
        text: `${notification.data!.body}\n\nOpen your account: ${target}\n\nYou enabled ${job.category === "renewal" ? "renewal reminder" : "analysis update"} emails.\nManage preferences: ${origin}/dashboard/reminders\nUnsubscribe from these emails: ${unsubscribe}`,
        headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        trackingSettings: { clickTracking: { enable: false, enableText: false }, openTracking: { enable: false } },
        customArgs: { notification_id: job.id },
      });
      providerAccepted = true;
      await finish({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: String(response[0]?.headers?.["x-message-id"] ?? ""), last_error: null });
      result.sent++;
    } catch (caught) {
      const error = caught as { code?: number; response?: { statusCode?: number } };
      const statusCode = Number(error.response?.statusCode || error.code) || undefined;
      const failure = providerAccepted ? { status: "uncertain", next_attempt_at: new Date().toISOString() } : deliveryFailure(statusCode, job.attempts);
      // Lookup failures occurred before contacting the provider and are safe to retry.
      if (!providerAccepted && caught instanceof Error && caught.message.includes("before send")) Object.assign(failure, deliveryFailure(503, job.attempts));
      await finish({ ...failure, last_error: providerAccepted ? "Provider accepted; completion needs review" : statusCode ? `Provider returned HTTP ${statusCode}` : "Delivery outcome unknown or eligibility unavailable" }).catch(() => console.error("Email claim requires review:", job.id));
      if (failure.status === "pending") result.retrying++; else if (failure.status === "failed") result.failed++; else result.uncertain++;
      console.error("Notification email delivery did not complete:", job.id, failure.status);
    }
  }
  return result;
}

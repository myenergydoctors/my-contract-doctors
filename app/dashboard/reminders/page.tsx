"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
type Agreement = { id: string; agreement_name: string | null; vendor: string | null; renewal_deadline: string | null; status: string; review_status: string };
type Schedule = { agreement_id: string; notice_deadline: string; enabled: boolean };
type Settings = { pro: boolean; administrator: boolean; emailDeliveryConfigured: boolean; automaticChecksConfigured: boolean; preferences: { analysis_email: boolean; renewal_email: boolean }; agreements: Agreement[]; schedules: Schedule[]; deliveries: { status: string; category: string; created_at: string }[] };
export default function ReminderSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const [analysisEmail, setAnalysisEmail] = useState(false), [renewalEmail, setRenewalEmail] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/account/reminders", { cache: "no-store" }); const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Reminder settings could not be loaded.");
    setSettings(data); setAnalysisEmail(data.preferences.analysis_email); setRenewalEmail(data.preferences.renewal_email);
  }, []);
  useEffect(() => { void load().catch(reason => setError(reason.message)); }, [load]);
  async function update(path: string, body: object) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The change could not be saved.");
      await load();
      window.dispatchEvent(new Event("mcd:notifications-refresh"));
      setMessage(path.endsWith("/check") ? data.emails.configured ? `Reminder check complete. ${data.emails.sent} email(s) accepted for delivery; ${data.emails.retrying} awaiting retry; ${data.emails.failed + data.emails.uncertain} require attention.` : "Reminders checked. Email delivery is not configured on this deployment yet." : "Preferences saved.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Please retry."); }
    finally { setBusy(false); }
  }
  return <div className="max-w-3xl space-y-6">
    <h2 className="font-serif text-navy text-3xl">Reminders &amp; notification emails</h2>
    {error && <p role="alert" className="text-red">{error} {!settings && <button className="underline" onClick={() => void load().catch(reason => setError(reason.message))}>Retry</button>}</p>}
    {message && <p role="status" className="text-teal">{message}</p>}
    {!settings ? !error && <p role="status">Loading your settings…</p> : <>
      {!settings.automaticChecksConfigured && <p className="text-sm text-gray-600">Automatic reminder checks are not active on this deployment. Use the manual check below.</p>}
      {!settings.emailDeliveryConfigured && <p className="text-sm text-gray-600">Email delivery is not active on this deployment. Your saved preferences and in-app reminders are available.</p>}
      <form onSubmit={event => { event.preventDefault(); void update("/api/account/notification-preferences", { analysisEmail, renewalEmail }); }} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-serif text-xl text-navy">Email preferences</h3>
        <p className="text-sm text-gray-600">Emails go to your verified sign-in address. These are account updates, separate from marketing consent. Turning them off stops queued and future emails; an email already being sent may finish.</p>
        <label className="flex gap-3"><input type="checkbox" checked={analysisEmail} onChange={event => setAnalysisEmail(event.target.checked)} />Email me when an invoice or agreement analysis is ready or fails</label>
        <label className="flex gap-3"><input type="checkbox" checked={renewalEmail} onChange={event => setRenewalEmail(event.target.checked)} />Email me renewal notice reminders for enabled Pro schedules</label>
        <button disabled={busy} className="bg-navy text-white px-4 py-2 rounded-lg disabled:opacity-50">Save email preferences</button>
      </form>
      <section className="space-y-4">
        <h3 className="font-serif text-xl text-navy">Confirmed notice deadlines</h3>
        <p className="text-sm text-gray-600">Pro reminders run at 90, 30, 7 and 1 day before the notice deadline, and on that day. Dates use UTC; scheduled checks run daily at 13:00 UTC. Confirm the notice deadline against your agreement, including notice delivery requirements. Enabling a schedule near its deadline produces the current reminder rather than all missed reminders.</p>
        {!settings.pro && <p className="text-sm text-gray-600">Renewal monitoring requires Pro. You can still disable an existing schedule.</p>}
        {settings.agreements.length === 0 && <p>No saved agreements yet. <Link href="/agreement" className="text-blue">Upload an agreement</Link>.</p>}
        {settings.agreements.map(agreement => <ScheduleForm key={`${agreement.id}:${settings.schedules.find(item => item.agreement_id === agreement.id)?.notice_deadline}:${settings.schedules.find(item => item.agreement_id === agreement.id)?.enabled}`} agreement={agreement} schedule={settings.schedules.find(item => item.agreement_id === agreement.id)} pro={settings.pro} busy={busy} save={body => update("/api/account/reminders", body)} />)}
      </section>
      <button disabled={busy} onClick={() => void update("/api/account/notifications/check", {})} className="bg-teal text-white px-4 py-2 rounded-lg disabled:opacity-50">Check reminders &amp; send queued emails now</button>
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
        <h3 className="font-serif text-xl text-navy">Recent email delivery</h3>
        <p className="text-sm text-gray-600">Sent means the email provider accepted it. Temporary failures retry automatically; “uncertain” needs a provider check to avoid a duplicate email.</p>
        {!settings.deliveries.length && <p>No email events yet. Enabling email applies to new notifications.</p>}
        {settings.deliveries.map((item, index) => <p key={index} className="text-sm">{item.category} · {item.status} · {new Date(item.created_at).toLocaleDateString()}</p>)}
      </section>
      <Link href="/dashboard/notifications" className="text-blue">View in-app notifications →</Link>
      {settings.administrator && <Link href="/dashboard/admin/notification-delivery" className="block text-blue">Review failed or uncertain email deliveries →</Link>}
    </>}
  </div>;
}
function ScheduleForm({ agreement, schedule, pro, busy, save }: { agreement: Agreement; schedule?: Schedule; pro: boolean; busy: boolean; save: (body: object) => Promise<void> }) {
  const [deadline, setDeadline] = useState(schedule?.notice_deadline || agreement.renewal_deadline || "");
  const [enabled, setEnabled] = useState(schedule?.enabled ?? false);
  const eligible = pro && agreement.status === "completed" && agreement.review_status === "confirmed";
  return <form onSubmit={event => { event.preventDefault(); void save({ agreementId: agreement.id, noticeDeadline: deadline, enabled }); }} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
    <h4 className="font-semibold text-navy">{agreement.agreement_name || "Service agreement"} · {agreement.vendor || "Vendor not identified"}</h4>
    {!eligible && <p className="text-sm text-gray-600">Confirm the saved agreement and use Pro before enabling monitoring.</p>}
    <label className="block text-sm">Non-renewal notice deadline <input required type="date" value={deadline} onChange={event => setDeadline(event.target.value)} className="block mt-1 p-2 border border-gray-300 rounded-lg" /></label>
    <label className="flex gap-3 text-sm"><input type="checkbox" checked={enabled} disabled={!eligible && !schedule?.enabled} onChange={event => setEnabled(event.target.checked)} />I checked this date against the agreement; enable reminders</label>
    <button disabled={busy || (!eligible && !schedule?.enabled)} className="text-blue underline disabled:opacity-50">Save reminder</button>
    <p className="text-xs text-gray-500">Changing a date supersedes older reminders. It cannot retract an email already delivered.</p>
  </form>;
}

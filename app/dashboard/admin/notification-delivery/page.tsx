"use client";
import { useEffect, useState } from "react";
type Job = { id: string; category: string; status: string; attempts: number; last_error: string };
export default function NotificationDeliveryAdminPage() {
  const [jobs, setJobs] = useState<Job[]>([]), [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  async function load() { const response = await fetch("/api/admin/notification-delivery", { cache: "no-store" }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setJobs(body.jobs); setLoaded(true); }
  useEffect(() => { void load().catch(reason => setError(reason.message)); }, []);
  async function resolve(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); const fields = new FormData(event.currentTarget); setBusy(true); setError("");
    try { const response = await fetch("/api/admin/notification-delivery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id, outcome: fields.get("outcome"), note: fields.get("note") }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "This delivery was already resolved."); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save resolution."); } finally { setBusy(false); }
  }
  return <div className="max-w-3xl space-y-5"><h2 className="font-serif text-3xl text-navy">Notification delivery review</h2><p>Check the provider record or recipient before resolving an uncertain delivery. Retry only after confirming it was not sent. Every resolution is audited; current preferences and eligibility are checked again before sending.</p>{error && <p role="alert" className="text-red">{error} <button className="underline" onClick={() => void load().catch(reason => setError(reason.message))}>Retry</button></p>}{loaded && !jobs.length && <p>No delivery failures requiring review.</p>}{jobs.map(job => <form key={job.id} onSubmit={event => void resolve(event, job.id)} className="p-5 bg-white border border-gray-200 rounded-xl space-y-3"><p>{job.category} · {job.status} · {job.attempts} attempts</p><code className="block text-xs">{job.id}</code><p>{job.last_error}</p><label className="block">Verified provider outcome<select name="outcome" required className="block border p-2"><option value="">Choose…</option><option value="confirmed_sent">Provider confirms it was sent</option><option value="confirmed_not_sent">Provider confirms it was not sent — retry</option></select></label><label className="block">Verification note<input name="note" required minLength={5} maxLength={500} className="block w-full border p-2" /></label><button disabled={busy} className="bg-navy text-white p-2 rounded">Save verified outcome</button></form>)}</div>;
}

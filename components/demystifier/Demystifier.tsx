"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Clause } from "@/lib/demystifier/content";
type Snapshot = { signedIn: boolean; access: boolean; clauses: Clause[]; checklist: string[] };
const sections = ["Minimum billing and early cancellation", "Automatic renewal and notice", "Price changes and finance charges", "Rental ownership and replacement values", "Service fees and surcharges", "Loss or damage protection", "Dispute process and location"];
export default function Demystifier() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  async function restore() {
    setBusy(true); setError(""); setMessage(""); setCopyMessage("");
    // Clear previously authorized content while checking current server access.
    setData(null); setSelected(0);
    try {
      const response = await fetch("/api/demystifier", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Access could not be checked.");
      setData(result); setMessage(result.access ? "Your saved Demystifier access is restored." : result.signedIn ? "No active Demystifier access was found for this account. Your free clause is available below." : "The free clause is available. Sign in to restore saved access.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Access could not be checked. Please retry."); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/demystifier", { cache: "no-store", signal: controller.signal }).then(async response => {
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Access could not be checked."); return result;
    }).then(setData).catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Access could not be checked."); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, []);
  const clause = data?.clauses[selected];
  async function copy() {
    if (!clause) return;
    try { await navigator.clipboard.writeText(clause.email); setCopyMessage("Draft copied. Review, customize and send it yourself; no email was sent."); }
    catch { setCopyMessage("Clipboard unavailable. Select and copy the draft text below; no email was sent."); }
  }
  return <main className="bg-off-white min-h-screen px-6 py-14 md:py-20">
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="max-w-3xl space-y-4">
        <p className="text-teal text-sm font-semibold uppercase tracking-wider">The Demystifier</p>
        <h1 className="font-serif text-navy text-4xl md:text-5xl">Understand the clauses before you sign.</h1>
        <p className="text-gray-600 leading-relaxed">Explore seven common service-agreement topics through a fictional example, plain-English explanations and copyable vendor questions. One complete clause is free.</p>
        <p className="text-sm text-gray-600">Educational examples only. These are not quotations from your agreement, personalized legal advice or a determination of enforceability. Check your signed terms and consult a qualified adviser for your situation.</p>
        <div className="flex flex-wrap gap-4">
          {!data?.access && <Link href="/checkout/demystifier" className="bg-teal text-white rounded-lg px-5 py-3">Preview checkout — $49.99</Link>}
          <button disabled={busy} onClick={() => void restore()} className="border border-navy rounded-lg px-5 py-3 disabled:opacity-50">{busy ? "Checking access…" : "Restore saved access"}</button>
          {data && !data.signedIn && <Link href="/sign-in?redirect=%2Fdemystifier" className="text-blue py-3">Sign in to restore access →</Link>}
        </div>
        <p className="text-sm text-gray-500">Checkout is a no-charge preview. Saving it does not unlock the full walkthrough. Existing verified access is restored from your account.</p>
      </header>
      {busy && <p role="status">Checking your saved access…</p>}
      {error && <div role="alert" className="bg-white border border-red-200 rounded-xl p-5 text-red-700">{error} <button onClick={() => void restore()} className="underline">Retry access check</button></div>}
      {message && <p role="status" className="text-navy">{message}</p>}
      {data && <section aria-label="Agreement walkthrough" className="grid md:grid-cols-[280px_1fr] border border-gray-200 rounded-2xl bg-white overflow-hidden">
        <nav aria-label="Clauses" className="p-5 bg-gray-50 space-y-2">
          <h2 className="font-serif text-navy text-xl mb-4">{data.access ? "Full walkthrough" : "Free clause preview"}</h2>
          {sections.map((title, index) => <button key={title} onClick={() => { setSelected(index); setCopyMessage(""); }} aria-pressed={selected === index} className={`block w-full text-left rounded-lg p-3 text-sm ${selected === index ? "bg-blue-pale text-navy" : "hover:bg-gray-100"}`}>{!data.access && index > 0 ? "🔒 " : ""}{title}</button>)}
        </nav>
        <article className="p-6 md:p-9 space-y-5">
          {clause ? <>
            <p className="text-sm font-semibold text-teal">{clause.risk === "high" ? "High" : clause.risk === "medium" ? "Medium" : "Low"} review priority · fictional example</p>
            <h2 className="font-serif text-navy text-2xl">{clause.title}</h2>
            <blockquote className="border-l-4 border-blue bg-blue-pale p-4 text-sm leading-relaxed">{clause.example}</blockquote>
            <h3 className="font-semibold text-navy">What it means</h3><p className="text-gray-700 leading-relaxed">{clause.explanation}</p>
            <h3 className="font-semibold text-navy">Check your agreement</h3><p className="text-gray-700 leading-relaxed">{clause.check}</p>
            <h3 className="font-semibold text-navy">A question to negotiate</h3><p className="text-gray-700 leading-relaxed">{clause.request}</p>
            <h3 className="font-semibold text-navy">Vendor email draft</h3>
            <textarea aria-label="Vendor email draft" readOnly value={clause.email} rows={10} className="w-full border border-gray-300 rounded-lg p-4 text-sm" />
            <button onClick={() => void copy()} className="bg-navy text-white rounded-lg px-5 py-3">Copy email draft</button>
            <p className="text-sm text-gray-500" role="status">{copyMessage || "Review and customize before sending. This page does not send email to your vendor."}</p>
          </> : <div className="space-y-4"><h2 className="font-serif text-navy text-2xl">{sections[selected]}</h2><p>This clause requires saved Demystifier access. Sign in with the account that received access, then choose Restore saved access.</p><Link href="/checkout/demystifier" className="text-blue underline">Explore no-charge checkout preview</Link></div>}
        </article>
      </section>}
      {!!data?.checklist.length && <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4"><h2 className="font-serif text-navy text-2xl">Before you sign</h2><p className="text-sm text-gray-500">Use this checklist for your review. Ticks are temporary for this page.</p>{data.checklist.map(item => <label key={item} className="flex gap-3 text-gray-700"><input type="checkbox" />{item}</label>)}</section>}
      <footer className="flex flex-wrap gap-6 text-blue"><Link href="/invoice">Analyze your own invoice →</Link><Link href="/agreement">Review your own agreement →</Link><Link href="/dashboard/billing">View saved checkout previews →</Link></footer>
    </div>
  </main>;
}

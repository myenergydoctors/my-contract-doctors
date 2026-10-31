"use client";
import Link from "next/link";
import { useState } from "react";
export default function NotificationUnsubscribePage() {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const unsubscribe = async () => {
    setBusy(true); setMessage("");
    try {
      const token = new URL(window.location.href).searchParams.get("token");
      const response = await fetch("/api/notifications/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setDone(true); setMessage("You are unsubscribed from this category of notification emails. Your other preferences are unchanged.");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Could not unsubscribe. Please retry."); }
    finally { setBusy(false); }
  };
  return <main className="max-w-xl mx-auto my-16 p-8 border border-gray-200 rounded-2xl bg-white">
    <h1 className="font-serif text-3xl text-navy mb-4">Notification email preferences</h1>
    <p className="text-gray-600 mb-5">Confirm below to stop this category of notification emails. Your sign-in and account-security emails will continue.</p>
    {message && <p role="status" className="mb-4">{message}</p>}
    {!done && <button disabled={busy} onClick={() => void unsubscribe()} className="bg-navy text-white px-4 py-2 rounded-lg disabled:opacity-50">{busy ? "Saving…" : "Confirm unsubscribe"}</button>}
    <Link href="/dashboard/reminders" className="block mt-6 text-blue">Manage all notification preferences →</Link>
  </main>;
}

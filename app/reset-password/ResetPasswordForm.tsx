"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8 || password !== confirmation) { setError("Use at least 8 characters and confirm the same password."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/account/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) { setError(result.error || "Could not reset your password."); return; }
      await createClient().auth.signOut();
      setDone(true);
    } catch { setError("Could not reset your password. Please try again."); }
    finally { setBusy(false); }
  };

  if (done) return <div className="font-sans text-sm text-navy" role="status">Password updated. <Link href="/sign-in" className="text-blue">Sign in with your new password</Link>.</div>;
  return <form onSubmit={submit} className="space-y-4">
    <label className="block font-sans text-xs font-semibold text-gray-700">New password
      <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)}
        className="mt-1.5 w-full font-sans text-sm font-normal text-navy bg-white rounded-lg px-3.5 py-3 border border-gray-300 outline-none focus:border-blue" />
    </label>
    <label className="block font-sans text-xs font-semibold text-gray-700">Confirm new password
      <input type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)}
        className="mt-1.5 w-full font-sans text-sm font-normal text-navy bg-white rounded-lg px-3.5 py-3 border border-gray-300 outline-none focus:border-blue" />
    </label>
    {error && <p role="alert" className="font-sans text-sm text-red">{error}</p>}
    <button disabled={busy} className="w-full font-sans text-sm font-medium bg-navy text-white py-3 rounded-lg disabled:opacity-60 cursor-pointer">{busy ? "Updating…" : "Set new password"}</button>
  </form>;
}

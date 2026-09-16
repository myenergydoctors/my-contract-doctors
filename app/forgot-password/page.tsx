"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", "/reset-password");
      callback.searchParams.set("intent", "password-recovery");
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: callback.toString() });
      if (resetError) { setError(resetError.message); return; }
      setSent(true);
    } catch {
      setError("Could not send the reset link. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <AuthShell eyebrow="Account recovery" title="Reset your password" subtitle="We'll email a link so you can set a new password.">
    {sent ? <div className="bg-teal-light border border-teal/30 rounded-xl p-5 font-sans text-sm text-navy" role="status">
      If an account uses that email, a reset link is on its way. Check your inbox and spam folder.
    </div> : <form onSubmit={submit} className="space-y-4">
      <label className="block font-sans text-xs font-semibold text-gray-700">Your account email
        <input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)}
          className="mt-1.5 w-full font-sans text-sm font-normal text-navy bg-white rounded-lg px-3.5 py-3 border border-gray-300 outline-none focus:border-blue" />
      </label>
      {error && <p role="alert" className="font-sans text-sm text-red">{error}</p>}
      <button disabled={busy} className="w-full font-sans text-sm font-medium bg-navy text-white py-3 rounded-lg disabled:opacity-60 cursor-pointer">{busy ? "Sending…" : "Send reset link"}</button>
    </form>}
    <p className="font-sans text-sm text-gray-500 mt-6 text-center"><Link href="/sign-in" className="text-blue">Back to sign in</Link></p>
  </AuthShell>;
}

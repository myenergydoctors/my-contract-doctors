"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import AuthProviders from "@/components/auth/AuthProviders";
import { createClient } from "@/lib/supabase/client";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(errorParam === "auth-callback-failed" ? "We couldn't complete the sign-in. Please try again." : "");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  };

  const sendMagicLink = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setError("");
    setMagicLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    setMagicLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMagicSent(true);
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your dashboard"
      subtitle="Pick up where you left off — your contracts, invoices, and analyses are waiting."
    >
      {magicSent ? (
        <div className="bg-teal-light border border-teal/30 rounded-2xl p-6 text-center">
          <div className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-teal mb-2">Magic link sent</div>
          <h3 className="font-serif text-navy text-lg mb-2">Check your inbox.</h3>
          <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-4">
            Click the link in the email we sent to <strong className="text-navy">{email}</strong> to sign in. It expires in 1 hour.
          </p>
          <button onClick={() => setMagicSent(false)} className="font-sans text-sm text-blue hover:text-navy bg-transparent border-none cursor-pointer">
            Back
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-light border border-red text-red font-sans text-sm rounded-lg p-3">
                {error}
              </div>
            )}
            <div>
              <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@yourbusiness.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full font-sans text-sm text-navy bg-white rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors placeholder:text-gray-400"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="font-sans text-xs font-semibold text-gray-700">Password</label>
                <Link href="#" className="font-sans text-xs text-blue hover:text-navy no-underline">Forgot?</Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full font-sans text-sm text-navy bg-white rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors placeholder:text-gray-400"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full font-sans text-sm font-medium bg-navy text-white py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <button
              type="button"
              onClick={sendMagicLink}
              disabled={magicLoading}
              className="w-full text-center font-sans text-sm font-medium text-blue border border-blue/30 bg-blue-pale/30 py-3 rounded-lg hover:bg-blue-pale transition-colors disabled:opacity-60 cursor-pointer"
            >
              {magicLoading ? "Sending..." : "Email me a magic link instead"}
            </button>
          </form>

          <Divider />

          <AuthProviders mode="sign-in" />

          <p className="text-center font-sans text-sm text-gray-500 mt-8">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-blue hover:text-navy font-medium no-underline">Sign up free</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<AuthShell eyebrow="Welcome back" title="Sign in"><div className="font-sans text-sm text-gray-500">Loading…</div></AuthShell>}>
      <SignInForm />
    </Suspense>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">or</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

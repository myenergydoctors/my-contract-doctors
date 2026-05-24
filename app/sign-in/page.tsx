"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import AuthProviders from "@/components/auth/AuthProviders";
import { signIn, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-auth";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Tiny delay so it feels real
    setTimeout(() => {
      const result = signIn(email, password);
      if (result.ok) {
        router.push("/dashboard");
      } else {
        setError(result.reason);
        setLoading(false);
      }
    }, 350);
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your dashboard"
      subtitle="Pick up where you left off — your contracts, invoices, and analyses are waiting."
    >
      {/* Demo notice */}
      <div className="mb-5 bg-teal-light border border-teal/30 rounded-lg px-4 py-3">
        <div className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-teal mb-1.5">Preview access</div>
        <div className="font-sans text-xs text-navy leading-relaxed">
          Email: <code className="bg-white px-1.5 py-0.5 rounded border border-teal/30 font-mono text-[11px]">{DEMO_EMAIL}</code><br />
          Password: <code className="bg-white px-1.5 py-0.5 rounded border border-teal/30 font-mono text-[11px]">{DEMO_PASSWORD}</code>
        </div>
      </div>

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
            className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors"
            required
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
            className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full font-sans text-sm font-medium bg-navy text-white py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <Link href="/check-email" className="block w-full text-center font-sans text-sm font-medium text-blue border border-blue/30 bg-blue-pale/30 py-3 rounded-lg no-underline hover:bg-blue-pale transition-colors">
          Email me a magic link instead
        </Link>
      </form>

      <Divider />

      <AuthProviders mode="sign-in" />

      <p className="text-center font-sans text-sm text-gray-500 mt-8">
        Don't have an account?{" "}
        <Link href="/sign-up" className="text-blue hover:text-navy font-medium no-underline">Sign up free</Link>
      </p>
    </AuthShell>
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

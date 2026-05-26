"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import AuthProviders from "@/components/auth/AuthProviders";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          business_name: business,
        },
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    // If email confirmation is required, Supabase returns user but no session.
    // If confirmation is disabled, the user is auto-signed-in.
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthShell eyebrow="Almost there" title="Check your inbox to confirm.">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-light text-teal flex items-center justify-center mx-auto mb-5 text-2xl">✓</div>
          <h3 className="font-serif text-navy text-xl mb-2">We sent you a confirmation link</h3>
          <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-6">
            Click the link in the email we sent to <strong className="text-navy">{email}</strong> to verify your account and sign in.
          </p>
          <Link href="/sign-in" className="font-sans text-sm text-blue hover:text-navy no-underline">
            Back to sign in →
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Get started — free"
      title="Create your account."
      subtitle="Your first invoice recommendation is free. No card required."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-light border border-red text-red font-sans text-sm rounded-lg p-3">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">First name</label>
            <input type="text" placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} required
              className="w-full font-sans text-sm text-navy bg-white rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors placeholder:text-gray-400" />
          </div>
          <div>
            <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Last name</label>
            <input type="text" placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} required
              className="w-full font-sans text-sm text-navy bg-white rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors placeholder:text-gray-400" />
          </div>
        </div>
        <div>
          <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Business name</label>
          <input type="text" placeholder="Acme Restaurant Group" value={business} onChange={e => setBusiness(e.target.value)} required
            className="w-full font-sans text-sm text-navy bg-white rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors placeholder:text-gray-400" />
        </div>
        <div>
          <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Work email</label>
          <input type="email" placeholder="jane@acme.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
            className="w-full font-sans text-sm text-navy bg-white rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors placeholder:text-gray-400" />
        </div>
        <div>
          <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Password</label>
          <input type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password"
            className="w-full font-sans text-sm text-navy bg-white rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors placeholder:text-gray-400" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full font-sans text-sm font-medium bg-teal text-white py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? "Creating account..." : "Create my account"}
        </button>
        <p className="font-sans text-[11px] text-gray-500 text-center">
          By signing up, you agree to our <Link href="#" className="text-blue hover:text-navy no-underline">Terms</Link> and <Link href="#" className="text-blue hover:text-navy no-underline">Privacy Policy</Link>.
        </p>
      </form>

      <Divider />

      <AuthProviders mode="sign-up" />

      <p className="text-center font-sans text-sm text-gray-500 mt-8">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-blue hover:text-navy font-medium no-underline">Sign in</Link>
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

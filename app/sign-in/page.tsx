import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import AuthProviders from "@/components/auth/AuthProviders";

export const metadata = { title: "Sign in | My Contract Doctors" };

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your dashboard"
      subtitle="Pick up where you left off — your contracts, invoices, and analyses are waiting."
    >
      <form action="/dashboard" className="flex flex-col gap-4">
        <div>
          <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Email</label>
          <input type="email" placeholder="you@yourbusiness.com" className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors" />
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <label className="font-sans text-xs font-semibold text-gray-700">Password</label>
            <Link href="#" className="font-sans text-xs text-blue hover:text-navy no-underline">Forgot?</Link>
          </div>
          <input type="password" placeholder="••••••••" className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors" />
        </div>
        <button type="submit" className="w-full font-sans text-sm font-medium bg-navy text-white py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
          Sign in
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

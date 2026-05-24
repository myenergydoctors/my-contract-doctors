import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import AuthProviders from "@/components/auth/AuthProviders";

export const metadata = { title: "Sign up | My Contract Doctors" };

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Get started — free"
      title={<>Create your account.</>}
      subtitle="Your first invoice analysis is on us. No credit card required."
    >
      <form action="/dashboard" className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">First name</label>
            <input type="text" placeholder="Jane" className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors" />
          </div>
          <div>
            <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Last name</label>
            <input type="text" placeholder="Smith" className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors" />
          </div>
        </div>
        <div>
          <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Business name</label>
          <input type="text" placeholder="Acme Restaurant Group" className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors" />
        </div>
        <div>
          <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Work email</label>
          <input type="email" placeholder="jane@acme.com" className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors" />
        </div>
        <div>
          <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Password</label>
          <input type="password" placeholder="At least 12 characters" className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors" />
        </div>
        <button type="submit" className="w-full font-sans text-sm font-medium bg-teal text-white py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer mt-2">
          Create my account
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

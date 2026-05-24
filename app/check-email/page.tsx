import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

export const metadata = { title: "Check your email | My Contract Doctors" };

export default function CheckEmailPage() {
  return (
    <AuthShell
      eyebrow="Magic link sent"
      title="Check your inbox."
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-light text-teal flex items-center justify-center mx-auto mb-5 text-2xl">✉</div>
        <h3 className="font-serif text-navy text-xl mb-2">We sent you a sign-in link</h3>
        <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-5">
          Click the link in the email to sign in. It expires in 15 minutes. If you don't see it, check your spam folder.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/sign-in" className="font-sans text-sm font-medium bg-white border border-gray-300 text-navy px-5 py-2.5 rounded-lg no-underline hover:bg-off-white transition-colors">
            ← Back to sign in
          </Link>
          <button className="font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
            Resend link
          </button>
        </div>
      </div>

      <p className="text-center font-sans text-xs text-gray-500 mt-6">
        Wrong email? <Link href="/sign-in" className="text-blue hover:text-navy no-underline">Try again</Link>
      </p>
    </AuthShell>
  );
}

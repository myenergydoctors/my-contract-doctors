import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

export const metadata = { title: "Sign up | My Contract Doctors" };

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Get started — free"
      title="Create your account."
      subtitle="Tell us about your business in 4 short steps and you'll have your dashboard up and running in under two minutes."
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-light text-teal flex items-center justify-center mx-auto mb-5 text-2xl">→</div>
        <h3 className="font-serif text-navy text-xl mb-2">Walk through onboarding</h3>
        <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-6">
          A guided 4-step setup — name your business, pick your vendor, estimate your spend, and upload your first invoice.
        </p>
        <Link href="/onboarding" className="inline-block w-full font-sans text-sm font-medium bg-teal text-white px-5 py-3 rounded-lg no-underline hover:opacity-90 transition-opacity">
          Start onboarding →
        </Link>
        <Link href="/sign-in" className="block mt-3 font-sans text-sm text-gray-500 hover:text-navy no-underline">
          I already have an account
        </Link>
      </div>

      <p className="text-center font-sans text-xs text-gray-500 mt-6">
        Have questions first? <Link href="/contact" className="text-blue hover:text-navy no-underline">Get in touch</Link>
      </p>
    </AuthShell>
  );
}

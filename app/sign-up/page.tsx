import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

export const metadata = { title: "Sign up | My Contract Doctors" };

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Coming soon"
      title="Account creation is coming."
      subtitle="We're in private preview while we put the finishing touches on. To explore the platform right now, use the preview credentials on the sign-in page."
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-pale text-blue flex items-center justify-center mx-auto mb-5 text-2xl">★</div>
        <h3 className="font-serif text-navy text-xl mb-2">Want early access?</h3>
        <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-6">
          We're rolling out new accounts in waves over the coming weeks. Drop us a note and we'll get you in.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact" className="font-sans text-sm font-medium bg-white border border-gray-300 text-navy px-5 py-2.5 rounded-lg no-underline hover:bg-off-white transition-colors">
            Request access
          </Link>
          <Link href="/sign-in" className="font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg no-underline hover:opacity-90 transition-opacity">
            Use preview access →
          </Link>
        </div>
      </div>

      <p className="text-center font-sans text-sm text-gray-500 mt-8">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-blue hover:text-navy font-medium no-underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}

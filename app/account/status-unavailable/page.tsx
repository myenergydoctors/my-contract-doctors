import Link from "next/link";
import { SITE } from "@/lib/site";

export default function AccountStatusUnavailablePage() {
  return <div className="min-h-screen bg-off-white px-6 py-16 flex items-center justify-center">
    <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="font-serif text-navy text-3xl mb-4">Account access is temporarily unavailable</h1>
      <p className="font-sans text-sm text-gray-600 leading-relaxed mb-6">We could not verify your account status right now. Please try again shortly. If this keeps happening, contact <a href={`mailto:${SITE.email}`} className="text-blue">{SITE.email}</a>.</p>
      <Link href="/dashboard" className="font-sans text-sm text-blue">Try again</Link>
    </div>
  </div>;
}

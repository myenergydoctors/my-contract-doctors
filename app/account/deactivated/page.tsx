import Link from "next/link";
import { SITE } from "@/lib/site";

export default function DeactivatedPage() {
  return <div className="min-h-screen bg-off-white px-6 py-16 flex items-center justify-center">
    <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8">
      <h1 className="font-serif text-navy text-3xl mb-4">Account deactivated</h1>
      <p className="font-sans text-sm text-gray-600 leading-relaxed mb-4">Dashboard access and new file requests are blocked. Your uploaded documents, analyses, and billing preview records remain stored while a retention policy is finalized. File links opened earlier may work for up to 10 minutes.</p>
      <p className="font-sans text-sm text-gray-600 leading-relaxed mb-6">For reactivation or questions about your data, email <a href={`mailto:${SITE.email}`} className="text-blue">{SITE.email}</a>.</p>
      <Link href="/" className="font-sans text-sm text-blue">Return to home</Link>
    </div>
  </div>;
}

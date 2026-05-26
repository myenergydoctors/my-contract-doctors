import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 md:px-8 py-16 bg-off-white">
      <div className="max-w-xl w-full text-center">
        <div className="flex justify-center mb-8">
          <Logo href={null} variant="light-bg" size="lg" showMark />
        </div>

        <div className="font-serif text-blue-light text-7xl md:text-8xl mb-3 italic">404</div>
        <h1 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-3">
          That page seems to be missing.
        </h1>
        <p className="font-sans font-light text-gray-500 leading-relaxed mb-8 max-w-md mx-auto">
          You may have followed a stale link, or we moved it. A few places that might help:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <Link href="/" className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue transition-colors no-underline text-left">
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue mb-1">Home</div>
            <div className="font-sans text-sm text-navy">Start over from the top</div>
          </Link>
          <Link href="/invoice" className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue transition-colors no-underline text-left">
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue mb-1">Free analysis</div>
            <div className="font-sans text-sm text-navy">Upload an invoice</div>
          </Link>
          <Link href="/pricing" className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue transition-colors no-underline text-left">
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue mb-1">Pricing</div>
            <div className="font-sans text-sm text-navy">See plans + comparison</div>
          </Link>
          <Link href="/help" className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue transition-colors no-underline text-left">
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue mb-1">Help center</div>
            <div className="font-sans text-sm text-navy">Common questions</div>
          </Link>
        </div>

        <Link href="/contact" className="inline-block font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg no-underline hover:opacity-90 transition-opacity">
          Still stuck? Get in touch →
        </Link>
      </div>
    </div>
  );
}

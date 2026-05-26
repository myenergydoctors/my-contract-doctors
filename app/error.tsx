"use client";
import Link from "next/link";
import { useEffect } from "react";
import Logo from "@/components/Logo";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production this would go to Sentry / LogRocket / etc.
    console.error("Page error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 md:px-8 py-16 bg-off-white">
      <div className="max-w-xl w-full text-center">
        <div className="flex justify-center mb-8">
          <Logo href={null} variant="light-bg" size="lg" showMark />
        </div>

        <div className="font-serif text-red text-7xl md:text-8xl mb-3 italic">500</div>
        <h1 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-3">
          Something went wrong on our end.
        </h1>
        <p className="font-sans font-light text-gray-500 leading-relaxed mb-8 max-w-md mx-auto">
          We've been notified. Try reloading, or take one of these routes:
        </p>

        {error.digest && (
          <div className="font-sans text-xs text-gray-400 mb-6">Error reference: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{error.digest}</code></div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={reset}
            className="font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            Try again
          </button>
          <Link href="/" className="font-sans text-sm font-medium bg-white border border-gray-300 text-navy px-5 py-2.5 rounded-lg no-underline hover:bg-off-white transition-colors">
            Back to homepage
          </Link>
        </div>

        <Link href="/contact" className="font-sans text-sm text-blue hover:text-navy no-underline">
          Report this issue →
        </Link>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "mcd_sticky_cta_dismissed";

// Hide on portal / auth / checkout / pages that already have prominent CTAs
const HIDE_ON = ["/dashboard", "/sign-in", "/sign-up", "/check-email", "/onboarding", "/checkout", "/invoice", "/agreement", "/free-guide"];

export default function StickyCtaBar() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true); // start dismissed to avoid SSR flicker
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(window.sessionStorage.getItem(KEY) === "1");
  }, []);

  if (!mounted || dismissed) return null;
  if (HIDE_ON.some(p => pathname?.startsWith(p))) return null;

  const dismiss = () => {
    window.sessionStorage.setItem(KEY, "1");
    setDismissed(true);
  };

  return (
    // Sits BELOW the fixed Nav (which is 68px tall). Use top-[68px].
    <div className="fixed top-[68px] left-0 right-0 z-[60] bg-gradient-to-r from-teal to-blue text-white px-4 md:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-sans text-xs md:text-sm font-medium leading-snug">
            <span className="hidden sm:inline">Find savings in your uniform contract — </span>
            <Link href="/invoice" className="underline underline-offset-2 hover:opacity-90 text-white">
              Upload an invoice free →
            </Link>
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-white/80 hover:text-white text-lg leading-none w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer flex-shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  );
}

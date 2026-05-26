"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "mcd_cookie_consent";

type Consent = "accepted" | "necessary-only" | null;

// Hide on portal / auth / checkout — those routes are already gated and
// already imply consent by the act of signing in.
const HIDE_ON_PREFIXES = ["/dashboard", "/sign-in", "/sign-up", "/check-email", "/onboarding", "/checkout"];

export default function CookieBanner() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>("accepted"); // start "accepted" to avoid SSR mismatch flash
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(KEY) as Consent;
    setConsent(stored || null);
  }, []);

  if (!mounted) return null;
  if (consent !== null) return null;
  if (HIDE_ON_PREFIXES.some(p => pathname?.startsWith(p))) return null;

  const choose = (c: "accepted" | "necessary-only") => {
    window.localStorage.setItem(KEY, c);
    setConsent(c);
    // Hook real analytics gating here once analytics is wired:
    // if (c === "accepted") window.dispatchEvent(new Event("analytics:consent-accepted"));
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[80]">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-5">
        <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-2">Cookies</div>
        <p className="font-sans text-sm text-navy leading-relaxed mb-4">
          We use cookies to keep you signed in and to understand how the site is used so we can improve it.
          You can accept everything or stick to what's strictly necessary.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => choose("accepted")}
            className="font-sans text-sm font-medium bg-navy text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            Accept all
          </button>
          <button
            onClick={() => choose("necessary-only")}
            className="font-sans text-sm font-medium bg-white border border-gray-300 text-navy px-4 py-2.5 rounded-lg hover:bg-off-white transition-colors cursor-pointer"
          >
            Necessary only
          </button>
        </div>
        <Link href="#" className="block mt-3 font-sans text-xs text-gray-500 hover:text-navy no-underline">
          Privacy policy →
        </Link>
      </div>
    </div>
  );
}

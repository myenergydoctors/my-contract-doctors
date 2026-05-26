"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "mcd_exit_intent_seen";

const HIDE_ON = ["/dashboard", "/sign-in", "/sign-up", "/check-email", "/onboarding", "/checkout", "/free-guide"];

export default function ExitIntentPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (window.sessionStorage.getItem(KEY) === "1") return;
    if (HIDE_ON.some(p => pathname?.startsWith(p))) return;

    // Desktop: trigger when mouse leaves the top of the viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !open) {
        setOpen(true);
        window.sessionStorage.setItem(KEY, "1");
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);

    // Mobile fallback: trigger when user has scrolled 70%+ of the page and
    // then scrolls back up significantly (proxy for "they're about to leave")
    let lastY = window.scrollY;
    let maxY = 0;
    const handleScroll = () => {
      const y = window.scrollY;
      const h = document.body.scrollHeight - window.innerHeight;
      const pct = h > 0 ? y / h : 0;
      if (pct > maxY) maxY = pct;
      if (maxY > 0.7 && y < lastY - 200 && !open) {
        setOpen(true);
        window.sessionStorage.setItem(KEY, "1");
      }
      lastY = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, open]);

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-5 py-8">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-navy to-navy-dark text-white px-6 md:px-8 pt-7 pb-6 relative">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg leading-none flex items-center justify-center transition-colors cursor-pointer"
          >
            ×
          </button>
          <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal mb-3">Before you go</div>
          <h2 className="font-serif text-2xl leading-tight mb-3">7 clauses worth knowing about — free guide.</h2>
          <p className="font-sans font-light text-white/70 leading-relaxed text-sm">
            A short PDF for small-business owners. The clauses most often hiding in uniform and linen service agreements, and exactly how to negotiate each one.
          </p>
        </div>
        {/* CTA */}
        <div className="p-6 md:p-8 flex flex-col gap-3">
          <Link
            href="/free-guide"
            onClick={() => setOpen(false)}
            className="font-sans text-sm font-medium bg-teal text-white px-5 py-3 rounded-lg no-underline text-center hover:opacity-90 transition-opacity"
          >
            Send me the PDF →
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="font-sans text-xs text-gray-500 hover:text-navy bg-transparent border-none cursor-pointer"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}

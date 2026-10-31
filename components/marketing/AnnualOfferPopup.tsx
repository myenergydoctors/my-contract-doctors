"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ANNUAL_OFFER_SEEN,
  money,
  offerCheckoutPath,
  type AnnualOfferStatus,
} from "@/lib/annual-offer/domain";
import type { AnnualOfferContext } from "./AnnualOfferButton";
const hidden = [
  "/dashboard",
  "/checkout",
  "/sign-in",
  "/sign-up",
  "/check-email",
  "/onboarding",
  "/upload",
  "/invoice",
  "/agreement",
  "/reset-password",
  "/forgot-password",
  "/account",
  "/free-guide",
  "/reviews",
];
export default function AnnualOfferPopup() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const routeVersion = useRef(0);
  const [open, setOpen] = useState(false),
    [context, setContext] = useState<AnnualOfferContext>({ source: "timed" });
  const [status, setStatus] = useState<AnnualOfferStatus | null>(null),
    [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(ANNUAL_OFFER_SEEN, "1");
    } catch {}
  }, []);
  const show = useCallback(async (next: AnnualOfferContext) => {
    const version = routeVersion.current;
    setContext(next);
    setError("");
    try {
      const response = await fetch("/api/annual-offer", { cache: "no-store" });
      const result = await response.json();
      if (version !== routeVersion.current) return;
      if (!response.ok)
        throw new Error(
          "The annual offer is temporarily unavailable. Please try again.",
        );
      if (!result.eligible) {
        if (next.source !== "timed") {
          setStatus(null);
          setError(
            "This introductory annual offer is not available for your account.",
          );
          setOpen(true);
        }
        return;
      }
      setStatus(result);
      setEmail(result.email || "");
      setOpen(true);
      try {
        localStorage.setItem(ANNUAL_OFFER_SEEN, "1");
      } catch {}
    } catch {
      if (version !== routeVersion.current) return;
      if (next.source !== "timed") {
        setStatus(null);
        setError(
          "The annual offer is temporarily unavailable. Please try again.",
        );
        setOpen(true);
      }
    }
  }, []);
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AnnualOfferContext>).detail;
      if (detail) void show(detail);
    };
    window.addEventListener("mcd:annual-offer", handler);
    return () => window.removeEventListener("mcd:annual-offer", handler);
  }, [show]);
  useEffect(() => {
    routeVersion.current += 1;
    setOpen(false);
    if (hidden.some((path) => pathname?.startsWith(path))) return;
    try {
      if (localStorage.getItem(ANNUAL_OFFER_SEEN)) return;
    } catch {}
    const timer = setTimeout(() => {
      if (
        document.querySelector(
          'dialog[open], [role="dialog"][aria-modal="true"]',
        )
      )
        return;
      void show({ source: "timed" });
    }, 5000);
    return () => clearTimeout(timer);
  }, [pathname, show]);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open) {
      node.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        node.close();
        document.body.style.overflow = previous;
      };
    }
    node.close();
  }, [open]);
  async function capture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/annual-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: context.source }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not save your offer.");
      setStatus(result);
      try {
        localStorage.setItem(ANNUAL_OFFER_SEEN, "1");
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your offer.");
    } finally {
      setBusy(false);
    }
  }
  const checkout = offerCheckoutPath(context);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="annual-offer-title"
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="fixed inset-0 m-auto max-h-[92dvh] w-[92vw] max-w-lg overflow-y-auto rounded-3xl border-0 bg-white p-0 text-navy shadow-2xl backdrop:bg-navy-dark/75 backdrop:backdrop-blur-sm"
    >
      <div className="relative bg-gradient-to-br from-navy to-navy-dark px-6 pb-7 pt-8 text-white sm:px-9">
        <button
          type="button"
          aria-label="Close annual offer"
          onClick={close}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl hover:bg-white/20"
        >
          ×
        </button>
        <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-teal-light">
          Your one-time annual offer
        </p>
        <h2
          id="annual-offer-title"
          className="max-w-sm font-serif text-3xl leading-tight sm:text-4xl"
        >
          {status?.saved
            ? "Your 30% offer is saved."
            : "Make the most of Pro. Save 30%."}
        </h2>
        <p className="mt-4 font-sans text-sm leading-6 text-white/75">
          The complete Pro membership, billed annually. Your first annual term
          is 30% off; plan allowances apply.
        </p>
      </div>
      <div className="space-y-5 px-6 py-7 sm:px-9">
        {status && (
          <>
            <div className="rounded-2xl border border-teal/20 bg-teal-light p-5">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-navy">
                First year of Pro annual
              </p>
              <p className="mt-2 flex flex-wrap items-baseline gap-3">
                <span className="font-serif text-4xl text-navy">
                  {money(status.quote.firstTermPriceCents)}
                </span>
                <s className="font-sans text-lg text-gray-500">
                  {money(status.quote.listPriceCents)}
                </s>
              </p>
              <p className="mt-2 font-sans text-sm text-gray-700">
                Save {money(status.quote.discountCents)}. One use per customer.
              </p>
            </div>
            <ul className="space-y-2 font-sans text-sm leading-6 text-gray-700">
              <li>✓ Up to 5 new invoice analyses per month</li>
              <li>✓ 1 agreement analysis credit per quarter</li>
              <li>✓ Saved history, monitoring, and eligible alerts</li>
            </ul>
            {status.saved ? (
              <>
                <p
                  role="status"
                  className="font-sans text-sm leading-6 text-gray-700"
                >
                  {status.requiresSignIn
                    ? "Sign in or create an account with the email you entered to use your saved offer."
                    : "Your offer is ready for your annual checkout preview."}
                </p>
                <Link
                  onClick={close}
                  href={
                    status.requiresSignIn
                      ? `/sign-up?redirect=${encodeURIComponent(checkout)}`
                      : checkout
                  }
                  className="block rounded-xl bg-teal px-5 py-3 text-center font-sans text-sm font-semibold text-white"
                >
                  Continue with my 30% offer →
                </Link>
                <Link
                  onClick={close}
                  href={`/sign-in?redirect=${encodeURIComponent(checkout)}`}
                  className="block text-center font-sans text-xs text-blue underline"
                >
                  Already have an account? Sign in
                </Link>
              </>
            ) : (
              <form onSubmit={capture} className="space-y-3">
                <label
                  htmlFor="annual-offer-email"
                  className="block font-sans text-sm font-semibold text-navy"
                >
                  Your email address
                </label>
                <input
                  id="annual-offer-email"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@yourbusiness.com"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-sans text-sm focus:outline-2 focus:outline-blue"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-teal px-5 py-3 font-sans text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy
                    ? "Saving your offer…"
                    : "Yes, save my 30% annual offer"}
                </button>
                <p className="font-sans text-xs leading-5 text-gray-500">
                  We’ll save your email for this offer. This does not subscribe
                  you to a newsletter.
                </p>
              </form>
            )}
            <p className="font-sans text-xs leading-5 text-gray-500">
              First annual term only. Subsequent years are at the then-current
              full annual price (currently{" "}
              {money(status.quote.renewalPriceCents)}). Checkout is currently a
              no-charge preview and does not activate paid access. Your offer is
              not consumed by a preview.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="font-sans text-sm text-red">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={close}
          className="block w-full py-2 text-center font-sans text-sm text-gray-500 underline underline-offset-4"
        >
          No thanks, I’ll pay full price
        </button>
      </div>
    </dialog>
  );
}

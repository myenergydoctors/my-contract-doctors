"use client";
import Link from "next/link";
import { useEffect } from "react";

type PaywallReason =
  | { type: "agreement"; currentPlan: "free" | "agreement" | "pro" }
  | { type: "pro-feature"; feature: string; currentPlan: "free" | "agreement" | "pro" };

type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
  reason: PaywallReason;
};

export default function PaywallModal({ open, onClose, reason }: PaywallModalProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const content = getContent(reason);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-br from-navy to-navy-dark text-white px-6 md:px-8 pt-7 pb-6 relative">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg leading-none flex items-center justify-center transition-colors cursor-pointer"
          >
            ×
          </button>
          <div className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-teal mb-3">
            {content.eyebrow}
          </div>
          <h2 className="font-serif text-2xl md:text-3xl leading-tight mb-3">{content.title}</h2>
          <p className="font-sans font-light text-white/70 leading-relaxed text-sm md:text-base">
            {content.body}
          </p>
        </div>

        {/* Options */}
        <div className="px-6 md:px-8 py-6 flex flex-col gap-3">
          {content.options.map((opt, i) => (
            <Link
              key={i}
              href={opt.href}
              onClick={onClose}
              className={`block rounded-xl p-5 no-underline transition-all ${
                opt.primary
                  ? "bg-teal text-white hover:opacity-90 border-2 border-teal"
                  : "bg-white border-2 border-gray-200 text-navy hover:border-blue"
              }`}
            >
              <div className="flex justify-between items-start gap-3 mb-1">
                <div className={`font-serif text-lg leading-tight ${opt.primary ? "text-white" : "text-navy"}`}>{opt.title}</div>
                <div className={`font-serif text-xl flex-shrink-0 ${opt.primary ? "text-white" : "text-navy"}`}>{opt.price}</div>
              </div>
              <div className={`font-sans text-sm leading-relaxed ${opt.primary ? "text-white/85" : "text-gray-500"}`}>
                {opt.description}
              </div>
              <div className={`font-sans text-sm font-medium mt-3 ${opt.primary ? "text-white" : "text-blue"}`}>
                {opt.cta} →
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 pb-6 -mt-2 flex justify-between items-center">
          <button
            onClick={onClose}
            className="font-sans text-sm text-gray-500 hover:text-navy bg-transparent border-none cursor-pointer"
          >
            Maybe later
          </button>
          <Link
            href="/pricing"
            onClick={onClose}
            className="font-sans text-sm text-blue hover:text-navy no-underline"
          >
            Compare all plans →
          </Link>
        </div>
      </div>
    </div>
  );
}

type ModalContent = {
  eyebrow: string;
  title: string;
  body: string;
  options: { title: string; price: string; description: string; cta: string; href: string; primary?: boolean }[];
};

function getContent(reason: PaywallReason): ModalContent {
  if (reason.type === "agreement") {
    if (reason.currentPlan === "free") {
      return {
        eyebrow: "Upgrade required",
        title: "Analyze your contract.",
        body: "Pick the option that fits — a one-time analysis of this contract, or unlimited contracts with Pro.",
        options: [
          {
            title: "The Agreement",
            price: "$49",
            description: "Full analysis of this one contract. Clause-by-clause, with negotiation emails ready to send. Lifetime access to the report.",
            cta: "Get this contract analyzed",
            href: "/checkout/agreement",
          },
          {
            title: "Pro plan",
            price: "$29/mo",
            description: "Unlimited contract and invoice analyses, plus Industry Insights and auto-renewal alerts. Cancel anytime.",
            cta: "Go Pro",
            href: "/checkout/pro",
            primary: true,
          },
        ],
      };
    }
    if (reason.currentPlan === "agreement") {
      return {
        eyebrow: "You've used your single analysis",
        title: "Unlock unlimited contracts.",
        body: "You're on the one-time Agreement plan. To analyze additional contracts, upgrade to Pro — you'll also get Industry Insights and auto-renewal alerts.",
        options: [
          {
            title: "Pro plan",
            price: "$29/mo",
            description: "Unlimited contract and invoice analyses, plus everything else Pro includes. Cancel anytime.",
            cta: "Upgrade to Pro",
            href: "/checkout/pro",
            primary: true,
          },
          {
            title: "One more, one time",
            price: "$49",
            description: "Buy another single Agreement analysis for one more contract. No subscription.",
            cta: "Add a single analysis",
            href: "/checkout/agreement",
          },
        ],
      };
    }
  }
  // Generic Pro-only feature
  return {
    eyebrow: "Pro plan required",
    title: `${(reason as any).feature ?? "This feature"} is Pro-only.`,
    body: "Upgrade to Pro to unlock this and everything else — unlimited invoice and contract analyses, Industry Insights, auto-renewal alerts.",
    options: [
      {
        title: "Pro plan",
        price: "$29/mo",
        description: "Unlimited everything. Cancel anytime.",
        cta: "Upgrade to Pro",
        href: "/checkout/pro",
        primary: true,
      },
    ],
  };
}

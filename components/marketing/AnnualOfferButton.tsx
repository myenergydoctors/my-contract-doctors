"use client";
import type { ReactNode } from "react";
import type { OfferSource } from "@/lib/annual-offer/domain";
export type AnnualOfferContext = {
  source: OfferSource;
  invoice?: string;
  agreement?: string;
};
export default function AnnualOfferButton({
  children,
  source = "paywall",
  invoice,
  agreement,
  className = "",
  onOpen,
}: {
  children: ReactNode;
  source?: OfferSource;
  invoice?: string;
  agreement?: string;
  className?: string;
  onOpen?: () => void;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onOpen?.();
        window.dispatchEvent(
          new CustomEvent<AnnualOfferContext>("mcd:annual-offer", {
            detail: { source, invoice, agreement },
          }),
        );
      }}
    >
      {children}
    </button>
  );
}

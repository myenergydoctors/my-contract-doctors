// Small reusable "30-day money-back guarantee" badge for pricing + checkout.
// Surface this near purchase CTAs to reduce conversion friction.

type GuaranteeBadgeProps = {
  variant?: "light-bg" | "dark-bg" | "inline";
};

export default function GuaranteeBadge({ variant = "light-bg" }: GuaranteeBadgeProps) {
  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-2 font-sans text-xs text-gray-500">
        <Shield />
        <span>30-day money-back guarantee</span>
      </div>
    );
  }
  const colors = variant === "dark-bg"
    ? "bg-white/10 border-white/15 text-white"
    : "bg-teal-light border-teal/30 text-navy";
  return (
    <div className={`inline-flex items-center gap-3 border rounded-full px-4 py-2 ${colors}`}>
      <Shield className={variant === "dark-bg" ? "text-teal" : "text-teal"} />
      <div>
        <div className={`font-sans text-[10px] font-semibold uppercase tracking-[0.14em] ${variant === "dark-bg" ? "text-teal" : "text-teal"}`}>30-day money-back</div>
        <div className={`font-sans text-xs ${variant === "dark-bg" ? "text-white/85" : "text-navy"}`}>Try Pro risk-free. Cancel within 30 days for a full refund.</div>
      </div>
    </div>
  );
}

function Shield({ className = "text-teal" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${className} flex-shrink-0`}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

import Link from "next/link";

type EmptyStateProps = {
  illustration?: "upload" | "contract" | "bell" | "chart";
  eyebrow?: string;
  title: string;
  body: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

export default function EmptyState({ illustration = "upload", eyebrow, title, body, primaryCta, secondaryCta }: EmptyStateProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto">
      <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center">
        <Illustration kind={illustration} />
      </div>
      {eyebrow && <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal mb-3">{eyebrow}</div>}
      <h2 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-3">{title}</h2>
      <p className="font-sans font-light text-gray-500 leading-relaxed mb-7 max-w-md mx-auto">{body}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {primaryCta && (
          <Link
            href={primaryCta.href}
            className="font-sans text-sm font-medium bg-teal text-white px-6 py-3 rounded-lg no-underline hover:opacity-90 transition-opacity"
          >
            {primaryCta.label}
          </Link>
        )}
        {secondaryCta && (
          <Link
            href={secondaryCta.href}
            className="font-sans text-sm font-medium bg-white border border-gray-300 text-navy px-6 py-3 rounded-lg no-underline hover:bg-off-white transition-colors"
          >
            {secondaryCta.label}
          </Link>
        )}
      </div>
    </div>
  );
}

function Illustration({ kind }: { kind: "upload" | "contract" | "bell" | "chart" }) {
  const stroke = "#3D80C8";
  const fill = "#E2EEFA";
  const accent = "#17A882";
  const common = "w-full h-full";

  if (kind === "upload") {
    return (
      <svg viewBox="0 0 80 80" className={common} xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="36" fill={fill} />
        <path d="M40 23 L40 49" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        <path d="M30 33 L40 23 L50 33" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="22" y="52" width="36" height="6" rx="3" fill={accent} />
      </svg>
    );
  }
  if (kind === "contract") {
    return (
      <svg viewBox="0 0 80 80" className={common} xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="36" fill={fill} />
        <rect x="25" y="20" width="30" height="40" rx="3" fill="#fff" stroke={stroke} strokeWidth="2.5" />
        <line x1="30" y1="30" x2="50" y2="30" stroke={stroke} strokeWidth="2" />
        <line x1="30" y1="36" x2="50" y2="36" stroke={stroke} strokeWidth="2" />
        <line x1="30" y1="42" x2="44" y2="42" stroke={stroke} strokeWidth="2" />
        <circle cx="50" cy="52" r="6" fill={accent} />
        <path d="M47 52 L49.5 54.5 L53 50.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  if (kind === "bell") {
    return (
      <svg viewBox="0 0 80 80" className={common} xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="36" fill={fill} />
        <path d="M28 47 L52 47 L52 45 C52 38 50 30 40 30 C30 30 28 38 28 45 Z" fill="#fff" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="40" cy="27" r="3" fill={stroke} />
        <path d="M36 52 C36 55 38 57 40 57 C42 57 44 55 44 52" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  // chart
  return (
    <svg viewBox="0 0 80 80" className={common} xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" fill={fill} />
      <rect x="24" y="44" width="6" height="14" rx="1" fill={stroke} />
      <rect x="34" y="36" width="6" height="22" rx="1" fill={stroke} />
      <rect x="44" y="28" width="6" height="30" rx="1" fill={accent} />
      <rect x="54" y="40" width="6" height="18" rx="1" fill={stroke} />
    </svg>
  );
}

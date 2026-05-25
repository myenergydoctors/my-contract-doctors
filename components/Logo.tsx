import Link from "next/link";

type LogoProps = {
  href?: string | null;
  variant?: "dark-bg" | "light-bg"; // controls wordmark color
  size?: "sm" | "md" | "lg";
  showMark?: boolean;
  onClick?: () => void;
  className?: string;
};

const sizeMap = {
  sm: { mark: 26, text: 17, eyebrowGap: -1 },
  md: { mark: 32, text: 20, eyebrowGap: -1 },
  lg: { mark: 40, text: 24, eyebrowGap: -1 },
};

export default function Logo({
  href = "/",
  variant = "dark-bg",
  size = "md",
  showMark = true,
  onClick,
  className = "",
}: LogoProps) {
  const s = sizeMap[size];
  const textColor = variant === "dark-bg" ? "text-white" : "text-navy";
  const italicColor = variant === "dark-bg" ? "text-blue-light" : "text-blue";
  const eyebrowColor = "text-blue-light";

  const inner = (
    <span className={`inline-flex items-center gap-2.5 leading-none ${className}`}>
      {showMark && (
        <span aria-hidden style={{ width: s.mark, height: s.mark }} className="flex-shrink-0">
          <Mark size={s.mark} />
        </span>
      )}
      <span className="flex flex-col leading-none">
        <span className={`font-sans text-[9px] font-semibold tracking-[0.22em] uppercase ${eyebrowColor}`}>My</span>
        <span className="flex items-baseline" style={{ marginTop: s.eyebrowGap }}>
          <span className={`font-serif ${textColor}`} style={{ fontSize: s.text }}>Contract&nbsp;</span>
          <span className={`font-serif italic ${italicColor}`} style={{ fontSize: s.text }}>Doctors</span>
        </span>
      </span>
    </span>
  );

  if (href === null) return <span onClick={onClick} className="cursor-pointer">{inner}</span>;
  return (
    <Link href={href} onClick={onClick} className="no-underline">
      {inner}
    </Link>
  );
}

export function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#0C2D54" />
      <path d="M11 21 L17 27.5 L29 13.5" stroke="#17A882" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="30" cy="13" r="2.2" fill="#6AAEE0" />
    </svg>
  );
}

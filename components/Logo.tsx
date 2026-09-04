import Link from "next/link";
import Image from "next/image";

type LogoProps = {
  href?: string | null;
  variant?: "dark-bg" | "light-bg"; // controls wordmark color
  size?: "sm" | "md" | "lg";
  showMark?: boolean;
  onClick?: () => void;
  className?: string;
};

const sizeMap = {
  sm: { width: 110 },
  md: { width: 150 },
  lg: { width: 190 },
};

const logoCrop = {
  canvasWidth: 1774,
  canvasHeight: 887,
  x: 179,
  y: 219,
  width: 1444,
  height: 411,
};

export default function Logo({
  href = "/",
  variant = "dark-bg",
  size = "md",
  onClick,
  className = "",
}: LogoProps) {
  const s = sizeMap[size];
  const scale = s.width / logoCrop.width;
  const isDark = variant === "dark-bg";

  const inner = (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden leading-none ${className}`}
      style={{ width: s.width, height: logoCrop.height * scale }}
    >
      <Image
        src={isDark
          ? "/brand/my-contract-doctors-logo-dark-bg.png"
          : "/brand/my-contract-doctors-logo-light-bg.png"}
        alt="My Contract Doctors"
        width={logoCrop.canvasWidth}
        height={logoCrop.canvasHeight}
        sizes={`${s.width}px`}
        loading="eager"
        unoptimized
        style={{
          position: "absolute",
          left: -logoCrop.x * scale,
          top: -logoCrop.y * scale,
          width: logoCrop.canvasWidth * scale,
          height: logoCrop.canvasHeight * scale,
          maxWidth: "none",
          mixBlendMode: isDark ? "screen" : "multiply",
          filter: "contrast(1.08)",
        }}
      />
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

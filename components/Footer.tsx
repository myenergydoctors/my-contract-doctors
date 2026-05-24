"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const columns = [
  {
    heading: "Products",
    links: [
      { label: "The Invoice",     href: "/invoice" },
      { label: "The Agreement",   href: "/agreement" },
      { label: "The Demystifier", href: "/demystifier" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Blog",              href: "/blog" },
      { label: "Contact",           href: "/contact" },
      { label: "My Energy Doctors", href: "https://myenergydoctors.com" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy",     href: "#" },
      { label: "Terms & Conditions", href: "#" },
      { label: "ADA Compliance",     href: "#" },
    ],
  },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard") || pathname === "/sign-in" || pathname === "/sign-up" || pathname === "/check-email") return null;

  return (
    <footer className="px-6 md:px-8 pt-12 pb-7" style={{ background: "#081E38" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>

        {/* Desktop: 4-col grid. Mobile: brand only, link columns rendered as accordions below. */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-10 lg:mb-12">

          {/* Brand */}
          <div className="text-center lg:text-left">
            <div className="mb-3.5">
              <span className="block font-sans text-[9px] font-semibold tracking-[0.22em] uppercase text-blue-light">My</span>
              <div>
                <span className="font-serif text-[20px] text-white">Contract </span>
                <span className="font-serif italic text-[20px] text-blue-light">Doctors</span>
              </div>
            </div>
            <p className="font-sans font-light text-[13px] leading-[1.7] text-white/45 max-w-[260px] mx-auto lg:mx-0">
              We're on your side, not the vendor's. Helping businesses demystify their uniform and linen agreements since 2026.
            </p>
          </div>

          {/* Desktop link columns */}
          {columns.map(({ heading, links }) => (
            <div key={heading} className="hidden lg:block">
              <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue-light mb-4">
                {heading}
              </div>
              {links.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block font-sans font-light text-[13px] text-white/50 hover:text-white no-underline mb-2.5 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Mobile accordions */}
        <div className="lg:hidden mb-10 border-t border-white/10">
          {columns.map(({ heading, links }) => (
            <FooterAccordion key={heading} heading={heading} links={links} />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-center sm:text-left" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="font-sans text-xs text-white/30">
            © 2026 My Contract Doctors | <a href="https://hermosa.design" target="_blank" className="hover:text-white/60 transition-colors">Website by Hermosa Design</a>
          </span>
          <span className="font-sans text-xs text-white/30">
            A sister company of <a href="https://myenergydoctors.com" target="_blank" className="hover:text-white/60 transition-colors">My Energy Doctors</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterAccordion({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex justify-between items-center py-4 bg-transparent border-none cursor-pointer text-left"
      >
        <span className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue-light">
          {heading}
        </span>
        <span
          className="text-blue-light text-lg leading-none transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${open ? "max-h-[300px]" : "max-h-0"}`}>
        <div className="flex flex-col items-center text-center pb-4 gap-2.5">
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="font-sans font-light text-[13px] text-white/60 hover:text-white no-underline transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

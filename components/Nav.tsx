"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const links = [
  { label: "Demystifier",   href: "/demystifier" },
  { label: "The Agreement", href: "/agreement" },
  { label: "The Invoice",   href: "/invoice" },
  { label: "Blog",          href: "/blog" },
  { label: "Contact",       href: "/contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  if (pathname?.startsWith("/dashboard") || pathname === "/sign-in" || pathname === "/sign-up" || pathname === "/check-email") return null;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 border-b border-white/10 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(12,45,84,0.97)" : "#0C2D54",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <div className="max-w-[1180px] mx-auto h-[68px] flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="no-underline flex flex-col leading-none" onClick={() => setOpen(false)}>
          <span className="font-sans text-[9px] font-semibold tracking-[0.22em] uppercase text-blue-light">My</span>
          <div className="flex items-baseline">
            <span className="font-serif text-[20px] md:text-[22px] text-white">Contract&nbsp;</span>
            <span className="font-serif italic text-[20px] md:text-[22px] text-blue-light">Doctors</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="font-sans text-sm font-medium text-white/80 hover:text-white no-underline transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            className="font-sans text-sm font-medium text-white/80 hover:text-white no-underline transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/invoice"
            className="font-sans text-sm font-medium bg-teal text-white px-6 py-2.5 rounded-lg no-underline hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] bg-transparent border-none cursor-pointer"
        >
          <span
            className="block w-6 h-[2px] bg-white transition-transform duration-300"
            style={{ transform: open ? "translateY(7px) rotate(45deg)" : "none" }}
          />
          <span
            className="block w-6 h-[2px] bg-white transition-opacity duration-200"
            style={{ opacity: open ? 0 : 1 }}
          />
          <span
            className="block w-6 h-[2px] bg-white transition-transform duration-300"
            style={{ transform: open ? "translateY(-7px) rotate(-45deg)" : "none" }}
          />
        </button>
      </div>

      {/* Mobile panel */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-300 ease-in-out ${open ? "max-h-[480px]" : "max-h-0"}`}
      >
        <div className="flex flex-col gap-1 py-4 border-t border-white/10">
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="font-sans text-base font-medium text-white/85 hover:text-white no-underline px-2 py-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            onClick={() => setOpen(false)}
            className="font-sans text-base font-medium text-white/85 hover:text-white no-underline px-2 py-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/invoice"
            onClick={() => setOpen(false)}
            className="font-sans text-base font-medium bg-teal text-white text-center px-6 py-3 rounded-lg no-underline mt-2 hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

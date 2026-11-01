"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import styles from "./Nav.module.css";

const links = [
  { label: "Demystifier", href: "/demystifier" },
  { label: "The Agreement", href: "/agreement" },
  { label: "The Invoice", href: "/invoice" },
  { label: "Pricing", href: "/pricing" },
  { label: "Customers", href: "/customers" },
  { label: "Blog", href: "/blog" },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const hidden =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/upload") ||
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/check-email";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 1200px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  if (hidden) return null;

  return (
    <nav
      className={`${styles.nav} fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 border-b border-white/10 transition-all duration-300`}
      style={{
        background: scrolled ? "rgba(12,45,84,0.97)" : "#0C2D54",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <div className="max-w-[1180px] mx-auto h-[68px] flex items-center justify-between">
        {/* Logo */}
        <Logo
          href="/"
          variant="dark-bg"
          size="md"
          onClick={() => setOpen(false)}
        />

        {/* Desktop links */}
        <div className={styles.desktopLinks}>
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              aria-current={
                pathname === href || pathname?.startsWith(`${href}/`)
                  ? "page"
                  : undefined
              }
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
            className="font-sans text-sm font-medium bg-[#138568] text-white px-6 py-2.5 rounded no-underline hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="marketing-menu"
          onClick={() => setOpen((o) => !o)}
          className={`${styles.menuToggle} flex flex-col justify-center items-center w-10 h-10 gap-[5px] bg-transparent border-none cursor-pointer`}
        >
          <span
            className="block w-6 h-[2px] bg-white transition-transform duration-300"
            style={{
              transform: open ? "translateY(7px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block w-6 h-[2px] bg-white transition-opacity duration-200"
            style={{ opacity: open ? 0 : 1 }}
          />
          <span
            className="block w-6 h-[2px] bg-white transition-transform duration-300"
            style={{
              transform: open ? "translateY(-7px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile panel */}
      <div
        id="marketing-menu"
        inert={!open}
        data-open={open}
        className={`${styles.mobilePanel} transition-[max-height] duration-300 ease-in-out`}
      >
        <div className="flex flex-col gap-1 py-4 border-t border-white/10">
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              aria-current={
                pathname === href || pathname?.startsWith(`${href}/`)
                  ? "page"
                  : undefined
              }
              onClick={() => setOpen(false)}
              className="font-sans text-base font-medium text-white/85 hover:text-white no-underline px-2 py-3 rounded hover:bg-white/5 transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            onClick={() => setOpen(false)}
            className="font-sans text-base font-medium text-white/85 hover:text-white no-underline px-2 py-3 rounded hover:bg-white/5 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/invoice"
            onClick={() => setOpen(false)}
            className="font-sans text-base font-medium bg-[#138568] text-white text-center px-6 py-3 rounded no-underline mt-2 hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

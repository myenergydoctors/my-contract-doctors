"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const links = [
  { label: "Demystifier",   href: "/demystifier" },
  { label: "The Agreement", href: "/agreement" },
  { label: "The Invoice",   href: "/invoice" },
  { label: "Blog",          href: "/blog" },
  { label: "Contact",       href: "/contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        .nav-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.82);
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #fff; }
        .nav-cta {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          background: #17A882;
          color: #fff;
          padding: 10px 24px;
          border-radius: 8px;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .nav-cta:hover { opacity: 0.88; }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(12,45,84,0.97)" : "#0C2D54",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        transition: "all 0.35s ease",
        padding: "0 48px",
      }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#6AAEE0" }}>My</span>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#fff" }}>Contract </span>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontStyle: "italic", color: "#6AAEE0" }}>&nbsp;Doctors</span>
            </div>
          </Link>

          {/* Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {links.map(({ label, href }) => (
              <Link key={label} href={href} className="nav-link">{label}</Link>
            ))}
            <Link href="/invoice" className="nav-cta">Get Started</Link>
          </div>
        </div>
      </nav>
    </>
  );
}
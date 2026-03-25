"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const C = {
  navy: "#0C2D54",
  teal: "#17A882",
  blueLight: "#6AAEE0",
};

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { label: "Demystifier", href: "/demystifier" },
    { label: "The Agreement", href: "/agreement" },
    { label: "The Invoice", href: "/invoice" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(12,45,84,0.97)" : C.navy,
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      transition: "all 0.35s ease",
      padding: "0 32px",
    }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 68,
      }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, cursor: "pointer" }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600,
              letterSpacing: "0.22em", textTransform: "uppercase", color: C.blueLight,
            }}>My</span>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#fff" }}>Contract </span>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontStyle: "italic", color: C.blueLight }}>&nbsp;Doctors</span>
            </div>
          </div>
        </Link>

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {links.map(({ label, href }) => (
            <Link key={label} href={href} style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
              color: "rgba(255,255,255,0.82)", textDecoration: "none",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.82)"}
            >{label}</Link>
          ))}
          <Link href="/invoice" style={{
            background: C.teal, color: "#fff",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
            padding: "9px 20px", borderRadius: 8, textDecoration: "none",
            transition: "background 0.2s",
          }}>Get Started</Link>
        </div>
      </div>
    </nav>
  );
}
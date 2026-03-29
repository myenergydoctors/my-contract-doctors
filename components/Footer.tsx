"use client";
import Link from "next/link";

const C = {
  navy: "#0C2D54", navyDark: "#081E38", blueLight: "#6AAEE0", teal: "#17A882",
};

export default function Footer() {
  return (
    <footer style={{ background: C.navyDark, padding: "48px 32px 28px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: C.blueLight, display: "block" }}>My</span>
              <div>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#fff" }}>Contract </span>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontStyle: "italic", color: C.blueLight }}>Doctors</span>
              </div>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 260 }}>
              We're on your side, not the vendor's. Helping businesses demystify their uniform and linen agreements since 2026.
            </p>
          </div>
          {[
            { heading: "Products", links: [{ label: "The Invoice", href: "/invoice" }, { label: "The Agreement", href: "/agreement" }, { label: "The Demystifier", href: "/demystifier" }] },
            { heading: "Company", links: [{ label: "Blog", href: "/blog" }, { label: "Contact", href: "/contact" }, { label: "My Energy Doctors", href: "https://myenergydoctors.com" }] },
            { heading: "Legal", links: [{ label: "Privacy Policy", href: "#" }, { label: "Terms & Conditions", href: "#" }, { label: "ADA Compliance", href: "#" }] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.blueLight, marginBottom: 16 }}>{heading}</div>
              {links.map(({ label, href }) => (
                <Link key={label} href={href} style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: 10 }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = "#fff"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)"}
                >{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            © 2026 My Contract Doctors | Website by OSC Web Design
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            A sister company of My Energy Doctors
          </span>
        </div>
      </div>
    </footer>
  );
}
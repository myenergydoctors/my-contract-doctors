import Link from "next/link";

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
  return (
    <>
      <style>{`
        .footer-link {
          display: block;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          margin-bottom: 10px;
          transition: color 0.2s;
        }
        .footer-link:hover { color: #fff; }
      `}</style>

      <footer style={{ background: "#081E38", padding: "48px 32px 28px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>

          {/* Top grid */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>

            {/* Brand */}
            <div>
              <div style={{ marginBottom: 14 }}>
                <span style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#6AAEE0" }}>My</span>
                <div>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#fff" }}>Contract </span>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontStyle: "italic", color: "#6AAEE0" }}>Doctors</span>
                </div>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 260 }}>
                We're on your side, not the vendor's. Helping businesses demystify their uniform and linen agreements since 2026.
              </p>
            </div>

            {/* Link columns */}
            {columns.map(({ heading, links }) => (
              <div key={heading}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6AAEE0", marginBottom: 16 }}>
                  {heading}
                </div>
                {links.map(({ label, href }) => (
                  <Link key={label} href={href} className="footer-link">
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              © 2026 My Contract Doctors | <a href="https://hermosa.design" target="_blank">Website by Hermosa Design</a>
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              A sister company of My Energy Doctors
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
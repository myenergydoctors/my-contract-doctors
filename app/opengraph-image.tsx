import { ImageResponse } from "next/og";

// Default Open Graph image for the site. Used when a page doesn't declare
// its own opengraph-image. Next.js generates this on demand.

export const runtime = "edge";
export const alt = "My Contract Doctors — Demystify Your Uniform Contract";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #081E38 0%, #0C2D54 100%)",
          color: "#fff",
          padding: "80px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#0C2D54",
              border: "2px solid #1d3a64",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 21 L17 27.5 L29 13.5" stroke="#17A882" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="30" cy="13" r="2.2" fill="#6AAEE0" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <div style={{ fontSize: 14, letterSpacing: 4, color: "#6AAEE0", textTransform: "uppercase", marginBottom: 6 }}>My</div>
            <div style={{ fontSize: 34, color: "#fff" }}>
              Contract <span style={{ fontStyle: "italic", color: "#6AAEE0" }}>Doctors</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 72, lineHeight: 1.05, marginBottom: 24, maxWidth: 1000 }}>
          Demystify your uniform contract.
        </div>
        <div style={{ fontSize: 72, lineHeight: 1.05, color: "#6AAEE0", fontStyle: "italic", marginBottom: 40 }}>
          Save thousands.
        </div>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", maxWidth: 900, lineHeight: 1.4 }}>
          We help businesses understand what they're signing and identify where there's room to negotiate.
        </div>
        <div style={{ position: "absolute", bottom: 40, right: 80, fontSize: 22, color: "rgba(255,255,255,0.5)" }}>
          mycontractdoctors.com
        </div>
      </div>
    ),
    { ...size }
  );
}

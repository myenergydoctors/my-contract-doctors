"use client";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────
const C = {
  navy:       "#0C2D54", navyDark:  "#081E38", blue:      "#3D80C8",
  blueMid:    "#2563A8", blueLight: "#6AAEE0", bluePale:  "#E2EEFA",
  teal:       "#17A882", tealLight: "#D4F2EA", white:     "#FFFFFF",
  offWhite:   "#F7F9FC", gray100:   "#F0F4F8", gray200:   "#E2E8F0",
  gray300:    "#CBD5E1", gray500:   "#64748B", gray700:   "#334155",
  red:        "#DC2626", redLight:  "#FEE2E2",
  amber:      "#D97706", amberLight:"#FEF3C7",
  green:      "#16A34A", greenLight:"#DCFCE7",
};
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`;

// ─────────────────────────────────────────
function Tag({ children, variant = "teal" }) {
  const m = {
    teal:  { bg: C.tealLight,  color: "#0D6E52" },
    blue:  { bg: C.bluePale,   color: C.blueMid },
    navy:  { bg: C.navy,       color: C.blueLight },
    red:   { bg: C.redLight,   color: C.red },
    amber: { bg: C.amberLight, color: C.amber },
    green: { bg: C.greenLight, color: C.green },
  };
  const s = m[variant] || m.teal;
  return (
    <span style={{ background: s.bg, color: s.color, fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, display: "inline-block" }}>
      {children}
    </span>
  );
}

function RiskBadge({ risk }) {
  const map = { high: "red", medium: "amber", low: "green" };
  const labels = { high: "High Risk", medium: "Medium Risk", low: "Low Risk" };
  return <Tag variant={map[risk]}>{labels[risk]}</Tag>;
}

function Btn({ children, onClick = () => {}, variant = "navy", full = false, size = "md", disabled = false, style = {} }) {
  const sz = { lg: { padding: "15px 32px", fontSize: 16 }, md: { padding: "12px 24px", fontSize: 14 }, sm: { padding: "8px 14px", fontSize: 12 } }[size];
  const th = {
    navy:    { background: C.navy,    color: "#fff",    border: "none", boxShadow: "none" },
    teal:    { background: C.teal,    color: "#fff",    border: "none", boxShadow: "0 4px 20px rgba(23,168,130,0.3)" },
    blue:    { background: C.blue,    color: "#fff",    border: "none", boxShadow: "none" },
    outline: { background: "transparent", color: C.navy, border: `1.5px solid ${C.navy}`, boxShadow: "none" },
    ghost:   { background: C.gray100, color: C.gray700, border: "none", boxShadow: "none" },
    tealOutline: { background: "transparent", color: C.teal, border: `1.5px solid ${C.teal}`, boxShadow: "none" },
  }[variant];
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ ...sz, ...th, ...style, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", opacity: disabled ? 0.5 : 1, width: full ? "100%" : "auto" }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >{children}</button>
  );
}

// ─────────────────────────────────────────
// NAV
// ─────────────────────────────────────────
function PrePurchasePage({ onPurchase }) {

  const risks = [
    { icon: "⚠️", label: "Auto-renews every 12 months", sub: "Miss the 90-day window and you're locked in for another year" },
    { icon: "💸", label: "40% cancellation penalty", sub: "Times every week remaining on your contract" },
    { icon: "📈", label: "Prices can rise anytime", sub: "Your invoice is the only notice they're required to give you" },
    { icon: "🔒", label: "Binding arbitration in Philadelphia", sub: "You waive your right to a local jury trial" },
    { icon: "📋", label: "80% minimum billing", sub: "Even if you reduce staff, you still owe 80% of original value" },
    { icon: "🛡️", label: "LDP charges billed automatically", sub: "Whether you lose items or not — it's charged every week" },
  ];

  return (
    <div style={{ background: C.offWhite, minHeight: "100vh" }}>

      {/* Hero */}
      <section style={{ background: `linear-gradient(160deg, ${C.navyDark} 0%, ${C.navy} 60%, #153D6B 100%)`, padding: "140px 32px 96px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
        <div style={{ position: "absolute", top: "10%", right: "8%", width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle, rgba(61,128,200,0.15) 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
          <Tag variant="teal">No upload required to get started</Tag>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(34px,5vw,58px)", color: "#fff", lineHeight: 1.1, margin: "20px 0 20px" }}>
            Your uniform contract has<br />
            <em style={{ fontStyle: "italic", color: C.blueLight }}>traps you haven't seen yet.</em>
          </h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 300, color: "rgba(255,255,255,0.7)", lineHeight: 1.75, maxWidth: 620, margin: "0 auto 40px" }}>
            The Demystifier walks you through every clause in a standard uniform and linen service agreement — in plain English — and shows you exactly where to push back, what to negotiate, and how to say it.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <Btn variant="teal" size="lg" onClick={onPurchase}>Preview checkout — $49.99 →</Btn>
            <a href="#preview" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 500, padding: "15px 32px", borderRadius: 9, textDecoration: "none" }}>
              See a preview ↓
            </a>
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
            One free clause preview · No-charge checkout preview · Full access is not active yet
          </div>
        </div>
      </section>

      {/* What's hiding in your contract */}
      <section style={{ padding: "88px 32px", background: C.white }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.blue, marginBottom: 12 }}>What's hiding in your contract</div>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(28px,4vw,42px)", color: C.navy, lineHeight: 1.15 }}>
              6 clauses most business owners<br />
              <em style={{ fontStyle: "italic", color: C.blue }}>never read until it's too late</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {risks.map(({ icon, label, sub }) => (
              <div key={label} style={{ background: C.offWhite, border: `1px solid ${C.gray200}`, borderRadius: 14, padding: "24px 22px" }}>
                <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 17, color: C.navy, marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 300, color: C.gray500, lineHeight: 1.65 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live preview / teaser */}
      <section id="preview" style={{ padding: "88px 32px", background: C.offWhite }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.teal, marginBottom: 12 }}>Live preview</div>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(26px,3.5vw,38px)", color: C.navy, lineHeight: 1.15, marginBottom: 14 }}>Here's what it looks like inside</h2>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 300, color: C.gray500, maxWidth: 540, margin: "0 auto" }}>
              Click a clause on the left to see the plain-English explanation, risk level, and recommended action on the right. One clause is free. Full access will be available when purchases are supported.
            </p>
          </div>

          {/* Teaser split-screen (locked) */}
          <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 40px rgba(12,45,84,0.08)" }}>
            {/* Toolbar */}
            <div style={{ background: C.navy, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E" }} />
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Service Agreement — ImageFirst / Berstein-Magoon-Gay LLC · Sample</div>
              <Tag variant="teal">Preview mode</Tag>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2" style={{ minHeight: 460 }}>
              {/* Left: contract */}
              <div className="px-7 pt-7 pb-0 border-b md:border-b-0 md:border-r" style={{ borderColor: C.gray200 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gray500, marginBottom: 16 }}>Contract text — click any highlighted clause</div>

                {/* Free teaser clause */}
                <div style={{ background: C.bluePale, border: `2px solid ${C.blue}`, borderRadius: 8, padding: "12px 14px", marginBottom: 10, cursor: "pointer" }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: C.blue, marginBottom: 4 }}>CANCELLATION & MINIMUM BILLING ← Click to preview</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.navy, lineHeight: 1.65 }}>
                    There will be a minimum weekly billing of 80% of this agreement value or 80% of the current invoice amount whichever is greater. Customer may discontinue service at any time provided customer pays Company a cancellation charge of 40% of the agreement value...
                  </div>
                </div>

                {/* Locked clauses */}
                {["Rental Terms & Item Ownership", "Auto-Renewal Clause", "Finance Charges & Price Increases", "Service Charge", "LDP Protection Charge", "Arbitration & Jury Waiver"].map((label, i) => (
                  <div key={i} style={{ background: C.gray100, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, filter: "blur(2px)", userSelect: "none", position: "relative" }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: C.gray500, marginBottom: 3 }}>{label.toUpperCase()}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.gray700, lineHeight: 1.6 }}>████████ ████ ███████ ████████ ██████ ████ ███ ████████ ███████ █████</div>
                  </div>
                ))}
              </div>

              {/* Right: free preview gloss */}
              <div style={{ padding: "28px", background: C.offWhite, display: "flex", flexDirection: "column" }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gray500, marginBottom: 16 }}>Plain-English explanation</div>

                <RiskBadge risk="high" />
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: C.navy, margin: "12px 0 10px", lineHeight: 1.2 }}>Minimum Billing & Cancellation Penalty</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 300, color: C.gray700, lineHeight: 1.75, marginBottom: 16 }}>
                  This is one of the most dangerous clauses in any uniform service agreement. Even if you reduce your staff or order, you still owe 80% of your original agreement value every week. And if you want to exit early, you pay 40% of the agreement value times every week remaining.
                </div>
                <div style={{ background: C.amberLight, border: `1px solid ${C.amber}`, borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: C.amber, marginBottom: 4 }}>Example calculation</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.gray700, lineHeight: 1.65 }}>On a $70.53/week agreement with 26 weeks left: cancellation = 40% × $70.53 × 26 = <strong>$733.51</strong> to exit early.</div>
                </div>

                {/* Locked content teaser */}
                <div style={{ marginTop: "auto", background: C.navy, borderRadius: 12, padding: "18px 20px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>🔒 Unlock 7 full clause breakdowns, negotiation scripts, and one-click email drafts</div>
                  <Btn variant="teal" onClick={onPurchase}>Preview checkout — $49.99</Btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section style={{ padding: "88px 32px", background: C.white }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(26px,3.5vw,38px)", color: C.navy, lineHeight: 1.15 }}>Everything included for $49.99</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {[
              { icon: "📄", title: "Full contract walkthrough", body: "Every clause in a standard uniform agreement explained in plain English — no legal degree required." },
              { icon: "🎯", title: "Risk ratings for every clause", body: "Each section is rated High, Medium, or Low risk so you know exactly where to focus your attention." },
              { icon: "✉️", title: "One-click negotiation emails", body: "Pre-written emails for every negotiable clause. Copy, customize, and send directly to your vendor." },
              { icon: "📋", title: "Pre-signing checklist", body: "A complete checklist to run through before you sign any uniform or linen service agreement." },
              { icon: "💡", title: "Negotiation scripts", body: "Specific language and tactics for pushing back on the most expensive and restrictive clauses." },
              { icon: "🔄", title: "Works for all major vendors", body: "Cintas, UniFirst, ALSCO, ImageFirst, Aramark and more — the same clause patterns appear everywhere." },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ display: "flex", gap: 16, padding: "20px 22px", background: C.offWhite, border: `1px solid ${C.gray200}`, borderRadius: 14 }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, color: C.navy, marginBottom: 5 }}>{title}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 300, color: C.gray500, lineHeight: 1.65 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ background: `linear-gradient(135deg, ${C.navy}, #153D6B)`, borderRadius: 18, padding: "40px 48px", textAlign: "center" }}>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 32, color: "#fff", marginBottom: 10 }}>
              Ready to take control of your contract?
            </div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,0.65)", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
              Explore the no-charge checkout preview. No payment or access is activated yet.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Btn variant="teal" size="lg" onClick={onPurchase}>Preview checkout — $49.99</Btn>
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 14 }}>
              No charge · No subscription or access created in preview
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────
// EMAIL DRAFT MODAL
// ─────────────────────────────────────────
export default function DemystifierPage() {
  const router = useRouter();
  return (
    <>
      <style>{`${FONTS} *,*::before,*::after{box-sizing:border-box;} html{scroll-behavior:smooth;} body{background:${C.offWhite};}`}</style>
      <PrePurchasePage onPurchase={() => router.push("/checkout/demystifier")} />
    </>
  );
}
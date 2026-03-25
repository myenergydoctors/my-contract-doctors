"use client";
import { useState, useEffect, useRef } from "react";

const COLORS = {
  navy: "#0C2D54",
  navyDark: "#081E38",
  blue: "#3D80C8",
  blueMid: "#2563A8",
  blueLight: "#6AAEE0",
  bluePale: "#E2EEFA",
  teal: "#17A882",
  tealLight: "#D4F2EA",
  white: "#FFFFFF",
  offWhite: "#F7F9FC",
  gray100: "#F0F4F8",
  gray300: "#CBD5E1",
  gray500: "#64748B",
  gray700: "#334155",
};

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
`;

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function FadeUp({ children, delay = 0, style = {} }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      ...style
    }}>
      {children}
    </div>
  );
}

/* ── HERO ── */
function Hero() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const target = 3240;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / 1800, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setCount(Math.floor(eased * target));
      if (prog < 1) requestAnimationFrame(step);
    };
    const timeout = setTimeout(() => requestAnimationFrame(step), 800);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${COLORS.navyDark} 0%, ${COLORS.navy} 55%, #153D6B 100%)`,
      position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center",
    }}>
      {/* Background grid texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }} />

      {/* Glow orbs */}
      <div style={{
        position: "absolute", top: "10%", right: "12%",
        width: 480, height: 480, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(61,128,200,0.18) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "5%", left: "5%",
        width: 320, height: 320, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(23,168,130,0.12) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "120px 32px 80px", width: "100%", position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

          {/* Left: copy */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(23,168,130,0.15)", border: "1px solid rgba(23,168,130,0.3)",
              borderRadius: 20, padding: "5px 14px", marginBottom: 28,
              animation: "fadeIn 0.6s ease forwards",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.teal }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: COLORS.teal }}>
                We're on your side, not the vendor's
              </span>
            </div>

            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(38px, 5vw, 58px)",
              lineHeight: 1.1, color: "#fff", marginBottom: 24,
              animation: "slideUp 0.7s ease 0.1s both",
            }}>
              Demystify your uniform contract.{" "}
              <em style={{ fontStyle: "italic", color: COLORS.blueLight }}>Save thousands.</em>
            </h1>

            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 300,
              lineHeight: 1.75, color: "rgba(255,255,255,0.7)", marginBottom: 40,
              maxWidth: 480, animation: "slideUp 0.7s ease 0.2s both",
            }}>
              Most businesses sign their uniform and linen agreements and never look at them again — quietly overpaying year after year. Upload your invoice or contract and we'll show you exactly where the money is going.
            </p>

            <div style={{
              display: "flex", gap: 14, flexWrap: "wrap",
              animation: "slideUp 0.7s ease 0.3s both",
            }}>
              <a href="#" style={{
                background: COLORS.teal, color: "#fff",
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
                padding: "14px 28px", borderRadius: 10, textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 24px rgba(23,168,130,0.35)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(23,168,130,0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(23,168,130,0.35)"; }}
              >
                Upload My Invoice — It's Free
                <span style={{ fontSize: 18 }}>→</span>
              </a>
              <a href="#" style={{
                background: "rgba(255,255,255,0.08)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
                padding: "14px 28px", borderRadius: 10, textDecoration: "none",
                transition: "background 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              >
                Explore the Demystifier
              </a>
            </div>

            {/* Trust signals */}
            <div style={{
              display: "flex", gap: 28, marginTop: 48,
              animation: "slideUp 0.7s ease 0.4s both",
            }}>
              {[
                { val: "2 min", label: "to get your first recommendation" },
                { val: "$0", label: "to upload & get started" },
                { val: "100%", label: "on your side, always" },
              ].map(({ val, label }) => (
                <div key={val}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#fff", lineHeight: 1 }}>{val}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, maxWidth: 100 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: animated savings card */}
          <div style={{ display: "flex", justifyContent: "center", animation: "slideUp 0.8s ease 0.2s both" }}>
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20, padding: 32, width: "100%", maxWidth: 380,
              backdropFilter: "blur(20px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>Invoice Analysis — Acme Restaurant Group</span>
              </div>

              {/* Fake invoice lines */}
              {[
                { item: "Uniforms (weekly rental)", cost: "$284.00", flag: false },
                { item: "Floor mats × 12", cost: "$520.00", flag: true },
                { item: "Shop rags (bulk)", cost: "$148.00", flag: true },
                { item: "Restroom supplies", cost: "$96.00", flag: false },
                { item: "Facility service charge", cost: "$64.00", flag: true },
              ].map(({ item, cost, flag }, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {flag && <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.teal, flexShrink: 0 }} />}
                    {!flag && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "transparent", flexShrink: 0 }} />}
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: flag ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)" }}>{item}</span>
                  </div>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: flag ? COLORS.teal : "rgba(255,255,255,0.4)" }}>{cost}</span>
                </div>
              ))}

              <div style={{
                marginTop: 20, padding: 16, borderRadius: 12,
                background: "rgba(23,168,130,0.15)", border: "1px solid rgba(23,168,130,0.25)",
              }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.teal, marginBottom: 6 }}>
                  Potential annual savings found
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: "#fff", lineHeight: 1 }}>
                  ${count.toLocaleString()}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
                  3 additional savings identified — upgrade to unlock
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
        background: `linear-gradient(to bottom, transparent, ${COLORS.offWhite})`,
      }} />
    </section>
  );
}

/* ── HOW IT WORKS (3-step) ── */
function HowItWorks() {
  const [ref, inView] = useInView();
  const steps = [
    {
      num: "01",
      title: "Upload your invoice or agreement",
      body: "Snap a photo or upload a PDF of your latest uniform invoice — or your full service agreement. We accept both.",
      color: COLORS.blue,
    },
    {
      num: "02",
      title: "Our AI scans and analyzes",
      body: "We extract every line item, compare rates against our database, and identify exactly where you're being overcharged.",
      color: COLORS.teal,
    },
    {
      num: "03",
      title: "Get your savings report",
      body: "Receive a plain-English breakdown of what to fix, how to negotiate, and how much you stand to save — starting for free.",
      color: COLORS.navy,
    },
  ];

  return (
    <section style={{ background: COLORS.offWhite, padding: "96px 32px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <FadeUp>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.blue,
              display: "block", marginBottom: 12,
            }}>How it works</span>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif", fontSize: "clamp(30px, 4vw, 42px)",
              color: COLORS.navy, lineHeight: 1.15, maxWidth: 540, margin: "0 auto",
            }}>
              From upload to savings in under two minutes
            </h2>
          </div>
        </FadeUp>

        <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {steps.map(({ num, title, body, color }, i) => (
            <div key={num} style={{
              background: COLORS.white, borderRadius: 16, padding: 36,
              border: `1px solid ${COLORS.gray300}`,
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(32px)",
              transition: `opacity 0.6s ease ${i * 0.12}s, transform 0.6s ease ${i * 0.12}s`,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                fontFamily: "'DM Serif Display', serif", fontSize: 72, fontStyle: "italic",
                color: color, opacity: 0.1,
                position: "absolute", top: -10, right: 20, lineHeight: 1,
                userSelect: "none",
              }}>{num}</div>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: color === COLORS.blue ? COLORS.bluePale : color === COLORS.teal ? COLORS.tealLight : "#E2EAF4",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
              }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: color }}>{num}</span>
              </div>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif", fontSize: 20, color: COLORS.navy,
                lineHeight: 1.2, marginBottom: 12,
              }}>{title}</h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 300,
                lineHeight: 1.75, color: COLORS.gray500,
              }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PRODUCT SECTIONS ── */
function ProductSection({ eyebrow, headline, subhead, body, cta, ctaHref, accent, reverse, badge, children }) {
  const [ref, inView] = useInView();
  return (
    <section style={{ background: COLORS.white, padding: "96px 32px", borderTop: `1px solid ${COLORS.gray100}` }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div ref={ref} style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center",
          direction: reverse ? "rtl" : "ltr",
        }}>
          <div style={{ direction: "ltr" }}>
            <div style={{
              opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}>
              {badge && (
                <span style={{
                  display: "inline-block", background: accent === COLORS.teal ? COLORS.tealLight : COLORS.bluePale,
                  color: accent, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
                  padding: "4px 12px", borderRadius: 20, marginBottom: 16,
                }}>{badge}</span>
              )}
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.18em", textTransform: "uppercase", color: accent,
                display: "block", marginBottom: 10,
              }}>{eyebrow}</span>
              <h2 style={{
                fontFamily: "'DM Serif Display', serif", fontSize: "clamp(26px, 3.5vw, 38px)",
                color: COLORS.navy, lineHeight: 1.15, marginBottom: 8,
              }}>{headline}</h2>
              {subhead && <p style={{
                fontFamily: "'DM Serif Display', serif", fontSize: 18, fontStyle: "italic",
                color: accent, marginBottom: 20, lineHeight: 1.3,
              }}>{subhead}</p>}
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 300,
                lineHeight: 1.8, color: COLORS.gray500, marginBottom: 32, maxWidth: 480,
              }}>{body}</p>
              <a href={ctaHref || "#"} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: accent, color: "#fff",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                padding: "12px 24px", borderRadius: 9, textDecoration: "none",
                transition: "transform 0.2s, opacity 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.opacity = "1"; }}
              >{cta} <span>→</span></a>
            </div>
          </div>
          <div style={{
            direction: "ltr",
            opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
          }}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── INVOICE VISUAL ── */
function InvoiceCard() {
  return (
    <div style={{
      background: COLORS.offWhite, borderRadius: 18, padding: 28,
      border: `1px solid ${COLORS.gray300}`,
      boxShadow: "0 8px 40px rgba(12,45,84,0.08)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.gray500, marginBottom: 2 }}>CINTAS CORPORATION</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: COLORS.navy }}>Weekly Invoice #00847</div>
        </div>
        <span style={{
          background: COLORS.tealLight, color: COLORS.teal,
          fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
          padding: "4px 10px", borderRadius: 20,
        }}>Analyzed ✓</span>
      </div>

      {[
        { label: "Garment rental — 12 employees", amount: "$312", saving: null },
        { label: "Floor mats × 8 (overpriced)", amount: "$416", saving: "Save $2,080/yr" },
        { label: "Facility fee (negotiable)", amount: "$74", saving: "Save $888/yr" },
        { label: "Restroom supplies", amount: "$88", saving: null },
      ].map(({ label, amount, saving }, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "11px 0", borderBottom: `1px solid ${COLORS.gray100}`,
        }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: saving ? COLORS.navy : COLORS.gray500 }}>{label}</div>
            {saving && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: COLORS.teal, marginTop: 2 }}>{saving}</div>}
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: saving ? COLORS.navy : COLORS.gray500 }}>{amount}</div>
        </div>
      ))}

      <div style={{
        marginTop: 18, padding: "14px 18px", borderRadius: 10,
        background: COLORS.navy, display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.blueLight, marginBottom: 2 }}>1 free recommendation unlocked</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>+ $2,968 more in savings available</div>
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: COLORS.teal }}>$416</div>
      </div>
    </div>
  );
}

/* ── DEMYSTIFIER VISUAL ── */
function DemystifierCard() {
  const [active, setActive] = useState(0);
  const terms = [
    { term: "Auto-renewal clause", risk: "High", desc: "Your contract rolls over automatically unless you give written notice 60–90 days before expiry. Most businesses miss this window every cycle." },
    { term: "Damage replacement fee", risk: "Medium", desc: "Vendors can charge full replacement cost for damaged items. This rate is often negotiable and should be capped as a percentage of the weekly charge." },
    { term: "Route service charge", risk: "Low", desc: "A flat fee added to every delivery. Standard across the industry, but the amount varies — worth comparing." },
  ];
  return (
    <div style={{
      background: COLORS.navy, borderRadius: 18, overflow: "hidden",
      boxShadow: "0 8px 40px rgba(12,45,84,0.15)",
    }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.blueLight }}>Contract Demystifier</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", padding: 20 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>Agreement terms</div>
          {terms.map(({ term, risk }, i) => (
            <div key={i}
              onClick={() => setActive(i)}
              style={{
                padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 6,
                background: active === i ? "rgba(61,128,200,0.2)" : "transparent",
                border: active === i ? `1px solid rgba(61,128,200,0.4)` : "1px solid transparent",
                transition: "all 0.2s",
              }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: active === i ? "#fff" : "rgba(255,255,255,0.65)", marginBottom: 4 }}>{term}</div>
              <span style={{
                fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                padding: "2px 7px", borderRadius: 10,
                background: risk === "High" ? "rgba(239,68,68,0.2)" : risk === "Medium" ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.15)",
                color: risk === "High" ? "#FCA5A5" : risk === "Medium" ? "#FCD34D" : "#86EFAC",
              }}>{risk} risk</span>
            </div>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>Plain-English explanation</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 300, lineHeight: 1.75, color: "rgba(255,255,255,0.75)" }}>
            {terms[active].desc}
          </div>
          <div style={{
            marginTop: 20, padding: "12px 14px", borderRadius: 8,
            background: "rgba(23,168,130,0.15)", border: "1px solid rgba(23,168,130,0.25)",
          }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: COLORS.teal, marginBottom: 4 }}>Recommended action</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
              Click to draft a negotiation email you can send directly to your vendor.
            </div>
            <div style={{
              marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6,
              background: COLORS.teal, color: "#fff", borderRadius: 6, padding: "6px 12px",
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}>Draft email →</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── AGREEMENT VISUAL ── */
function AgreementCard() {
  return (
    <div style={{
      borderRadius: 18, overflow: "hidden",
      border: `1px solid ${COLORS.gray300}`,
      boxShadow: "0 8px 40px rgba(12,45,84,0.08)",
    }}>
      <div style={{
        background: COLORS.navy, padding: "16px 22px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: COLORS.blueLight }}>Your Cintas Agreement — Uploaded</div>
        <span style={{ background: COLORS.teal, color: "#fff", fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20, fontFamily: "'DM Sans', sans-serif" }}>AI Scan Complete</span>
      </div>
      <div style={{ background: COLORS.white, padding: 22 }}>
        {[
          { label: "Contract length", value: "60 months", flag: true, note: "Above average. Industry standard is 36–48 months." },
          { label: "Annual price escalator", value: "4.5%", flag: true, note: "Negotiable. Ask to cap at 3% or CPI." },
          { label: "Early termination fee", value: "18 weeks", flag: false, note: "Within normal range." },
          { label: "Damage replacement rate", value: "Full cost", flag: true, note: "Negotiate to 50% of weekly garment charge." },
        ].map(({ label, value, flag, note }, i) => (
          <div key={i} style={{
            padding: "13px 0", borderBottom: i < 3 ? `1px solid ${COLORS.gray100}` : "none",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: flag ? 5 : 0 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.gray700 }}>{label}</span>
              <span style={{
                fontFamily: "'DM Serif Display', serif", fontSize: 15,
                color: flag ? "#DC2626" : COLORS.teal,
              }}>{value}</span>
            </div>
            {flag && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.gray500, lineHeight: 1.5 }}>{note}</div>}
          </div>
        ))}
        <div style={{
          marginTop: 14, padding: "12px 16px", borderRadius: 10,
          background: COLORS.bluePale, border: `1px solid rgba(61,128,200,0.2)`,
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: COLORS.blueMid, lineHeight: 1.6,
        }}>
          <strong>3 high-priority issues found.</strong> Addressing all of them could save you an estimated $4,100 per year over the life of your contract.
        </div>
      </div>
    </div>
  );
}

/* ── CTA BAND ── */
function CTABand() {
  const [ref, inView] = useInView();
  return (
    <section style={{
      background: `linear-gradient(135deg, ${COLORS.navy} 0%, #153D6B 100%)`,
      padding: "96px 32px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "-30%", right: "-5%", width: 500, height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(61,128,200,0.15) 0%, transparent 70%)",
      }} />
      <div ref={ref} style={{
        maxWidth: 720, margin: "0 auto", textAlign: "center",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
        position: "relative", zIndex: 1,
      }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 44px)",
          color: "#fff", lineHeight: 1.15, marginBottom: 18,
        }}>
          Ready to see what your vendor<br />
          <em style={{ fontStyle: "italic", color: COLORS.blueLight }}>doesn't want you to know?</em>
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 300,
          color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: 40,
        }}>
          Upload your invoice in under a minute and get your first savings recommendation — completely free. No credit card, no commitment.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#" style={{
            background: COLORS.teal, color: "#fff",
            fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
            padding: "15px 32px", borderRadius: 10, textDecoration: "none",
            boxShadow: "0 4px 24px rgba(23,168,130,0.35)",
            transition: "transform 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >Upload My Invoice — Free</a>
          <a href="#" style={{
            background: "rgba(255,255,255,0.1)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)",
            fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
            padding: "15px 32px", borderRadius: 10, textDecoration: "none",
            transition: "background 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.16)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          >Browse the Demystifier</a>
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER ── */
function Footer() {
  return (
    <footer style={{ background: COLORS.navyDark, padding: "48px 32px 28px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: COLORS.blueLight, display: "block" }}>My</span>
              <div>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#fff" }}>Contract </span>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontStyle: "italic", color: COLORS.blueLight }}>Doctors</span>
              </div>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 260 }}>
              We're on your side, not the vendor's. Helping businesses demystify their uniform and linen agreements since 2026.
            </p>
          </div>
          {[
            { heading: "Products", links: ["The Invoice", "The Agreement", "The Demystifier", "Our Shop"] },
            { heading: "Company", links: ["About Us", "Contact", "Partners", "My Energy Doctors"] },
            { heading: "Legal", links: ["Privacy Policy", "Terms & Conditions", "ADA Compliance"] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.blueLight, marginBottom: 16 }}>{heading}</div>
              {links.map(l => (
                <a key={l} href="#" style={{
                  display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 300,
                  color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: 10,
                  transition: "color 0.2s",
                }}
                  onMouseEnter={e => e.target.style.color = "#fff"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                >{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
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

/* ── EMAIL POPUP ── */
function EmailPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { if (!dismissed) setShow(true); }, 5000);
    return () => clearTimeout(t);
  }, [dismissed]);

  if (!show || dismissed) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(8,30,56,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}
      onClick={e => { if (e.target === e.currentTarget) setDismissed(true); }}
    >
      <div style={{
        background: COLORS.white, borderRadius: 20, padding: 44, maxWidth: 440, width: "100%",
        position: "relative", boxShadow: "0 24px 80px rgba(12,45,84,0.25)",
        animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
      }}>
        <button onClick={() => setDismissed(true)} style={{
          position: "absolute", top: 16, right: 16, background: "none", border: "none",
          fontSize: 20, cursor: "pointer", color: COLORS.gray500, lineHeight: 1,
        }}>×</button>

        {!submitted ? <>
          <div style={{
            background: COLORS.tealLight, color: COLORS.teal,
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
            padding: "5px 14px", borderRadius: 20, display: "inline-block", marginBottom: 16,
          }}>Save 10% on your first report</div>
          <h3 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 26, color: COLORS.navy,
            lineHeight: 1.2, marginBottom: 10,
          }}>Find out how much your contract is costing you</h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 300,
            color: COLORS.gray500, lineHeight: 1.7, marginBottom: 24,
          }}>
            Join businesses saving thousands per year. Get tips, insights, and your exclusive 10% discount.
          </p>
          <input
            type="email" placeholder="your@email.com" value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 8, marginBottom: 12,
              border: `1.5px solid ${COLORS.gray300}`, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              outline: "none", color: COLORS.navy,
            }}
          />
          <button onClick={() => setSubmitted(true)} style={{
            width: "100%", background: COLORS.navy, color: "#fff", border: "none",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
            padding: "13px", borderRadius: 8, cursor: "pointer", marginBottom: 10,
          }}>Claim My 10% Discount</button>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.gray500, textAlign: "center" }}>No spam. Unsubscribe anytime.</div>
        </> : <>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: COLORS.navy, marginBottom: 10 }}>You're in!</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 300, color: COLORS.gray500 }}>Check your inbox for your 10% discount code.</p>
            <button onClick={() => setDismissed(true)} style={{
              marginTop: 20, background: COLORS.teal, color: "#fff", border: "none",
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
              padding: "11px 24px", borderRadius: 8, cursor: "pointer",
            }}>Let's get started →</button>
          </div>
        </>}
      </div>
    </div>
  );
}

/* ── ROOT ── */
export default function App() {
  return (
    <>
      <style>{`
        ${fonts}
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #F7F9FC; }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
        @keyframes popIn  { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
        }
      `}</style>
      <Hero />
      <HowItWorks />
      <ProductSection
        eyebrow="The Invoice"
        headline="Upload your invoice. Get instant savings."
        subhead="One free recommendation, immediately."
        body="Snap a photo or upload your latest Cintas, UniFirst, or ALSCO invoice. Our AI reads every line item, calculates your annual spend, and surfaces exactly where you're being overcharged — starting with one free recommendation the moment you upload."
        cta="Upload My Invoice — Free"
        accent={COLORS.teal}
        badge="Free to start"
      >
        <InvoiceCard />
      </ProductSection>

      <ProductSection
        eyebrow="The Demystifier"
        headline="Understand your agreement before you negotiate."
        subhead="No upload required to get started."
        body="Walk through every clause, term, and trap in a standard uniform service agreement — in plain English. When you reach a point where you can take action, we'll draft the email for you. Know what you're signing before you ever sign it again."
        cta="Explore the Demystifier"
        accent={COLORS.blue}
        reverse
      >
        <DemystifierCard />
      </ProductSection>

      <ProductSection
        eyebrow="The Agreement"
        headline="Upload your contract. Get personalized analysis."
        subhead="AI-powered, specific to your deal."
        body="Upload your actual service agreement and we'll scan it against our database of thousands of contracts in your region. We'll identify every term that's above average, every clause worth negotiating, and calculate exactly how much you could save over the life of your contract."
        cta="Analyze My Agreement"
        accent={COLORS.navy}
        badge="$49.99 — instant access"
      >
        <AgreementCard />
      </ProductSection>

      <CTABand />
      <Footer />
      <EmailPopup />
    </>
  );
}
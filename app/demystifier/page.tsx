"use client";
import { useState, useRef, useEffect } from "react";

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
// REAL CONTRACT CLAUSES — ImageFirst / Berstein-Magoon-Gay LLC
// Mapped to glossary content from glossary.pdf
// ─────────────────────────────────────────
const CLAUSES = [
  {
    id: "rental-terms",
    label: "Rental Terms & Ownership",
    risk: "medium",
    contractText: `Berstein-Magoon-Gay, LLC. ("Company"), agrees to supply, and the undersigned customer agrees to rent the above items on the terms set forth herein. All items are and will remain the property of Company, and the customer agrees to return such items on demand and to be liable for any loss or destruction of such items, including such loss or destruction caused by customer's employees, except as a result of normal wear, and to pay therefore, at prevailing customer's cost for such lost or damaged items. Company agrees to pick up soiled garments and linens and deliver them cleaned, in good condition weekly. Items worn beyond repair will be replaced at Company's discretion. The decision of style and type of garment used for personal protection has been made by the customer. Customer acknowledges that the garments and linens rented are for general purposes and are not designed nor intended for use in areas of flammability risk or where contact with ignition source is possible.`,
    title: "Rental Terms & Item Ownership",
    risk_label: "Know Your Liability",
    explanation: `Everything you rent stays owned by the vendor — you are renting, not buying. This means if items are lost or damaged beyond "normal wear," you pay their replacement cost at the vendor's prevailing rate, which is often much higher than market value.\n\nPay close attention to the phrase "normal wear" — the vendor decides what qualifies. This gives them significant discretion to charge you for replacements you may feel are unwarranted.`,
    negotiation: `Negotiate a specific definition of "normal wear" in writing before signing. Ask for a cap on replacement costs as a percentage of the weekly rental fee. Ensure the agreement specifies that replacement items must be approved by your company representative before being put into service.`,
    action: "draft-email",
    actionLabel: "Draft: Request Replacement Cost Cap",
    emailSubject: "Request to Define Normal Wear & Cap Replacement Costs",
    emailBody: `Dear [Vendor Representative],

Thank you for the opportunity to work together. Before finalizing our service agreement, I'd like to address the replacement cost terms.

I'd like to add the following language to our agreement:
- "Normal wear" shall be defined as gradual deterioration from standard use over a minimum of [X] months of service.
- Replacement costs for lost or damaged items shall not exceed [X]% of the item's weekly rental fee multiplied by 52 weeks.
- All replacement items must be approved by an authorized company representative prior to being placed into service.

Please confirm these terms can be added to the agreement. I look forward to your response.

Sincerely,
[Your Name]
[Business Name]`,
  },
  {
    id: "contract-term",
    label: "Contract Length & Auto-Renewal",
    risk: "high",
    contractText: `The term of this agreement is for twelve (12) months from the date of the first delivery and thereafter for the same time period unless cancelled by either party, in writing, at least ninety (90) days prior to any termination date. The terms of this contract shall apply to all subsequent increases or additions to such service.`,
    title: "Contract Length & Auto-Renewal",
    risk_label: "High Risk — Act Before Deadline",
    explanation: `This agreement automatically renews for another full 12-month term unless you send written cancellation at least 90 days before the end date. Most businesses miss this window — the vendor counts on it.\n\nIf you miss the 90-day window, you are locked in for another full year with no ability to exit without paying the cancellation penalty. Mark this date on your calendar the day you sign.\n\nNote: While this contract is 12 months, many vendors (including Cintas) push for 60-month terms. You do NOT have to agree to long terms — negotiate this aggressively.`,
    negotiation: `Request a shorter initial term (12 months is reasonable for facility services). Ask to reduce the cancellation notice period from 90 days to 30 or 60 days. Insist the auto-renewal clause be struck or modified so the agreement converts to month-to-month after the initial term.`,
    action: "draft-email",
    actionLabel: "Draft: Request Month-to-Month After Term",
    emailSubject: "Request to Modify Auto-Renewal Terms",
    emailBody: `Dear [Vendor Representative],

I am reviewing our service agreement and would like to discuss the auto-renewal clause before signing.

I'd like to request the following modifications:
1. Reduce the cancellation notice period from 90 days to 30 days.
2. After the initial 12-month term, the agreement converts to a month-to-month arrangement rather than automatically renewing for another full term.

This gives both parties flexibility while still providing a stable initial commitment. Please let me know if this can be accommodated.

Thank you,
[Your Name]
[Business Name]`,
  },
  {
    id: "minimum-billing",
    label: "Minimum Billing Guarantee",
    risk: "high",
    contractText: `There will be a minimum weekly billing of 80% of this agreement value or 80% of the current invoice amount whichever is greater. Customer may discontinue service at any time provided customer pays Company a cancellation charge of 40% of the agreement value or the current invoice amount, whichever is greater, multiplied by the number of weeks remaining under the agreement.`,
    title: "Minimum Billing & Cancellation Penalty",
    risk_label: "High Risk — Major Financial Exposure",
    explanation: `This is one of the most dangerous clauses in any uniform service agreement. There are two critical traps here:\n\n1. MINIMUM BILLING: Even if you reduce your order (fewer employees, fewer items), you must pay at least 80% of your original agreement value every week. Downsizing your business doesn't reduce your bill.\n\n2. CANCELLATION PENALTY: If you want to exit early, you owe 40% of the agreement value multiplied by every week remaining. On a $70/week agreement with 26 weeks left, that's $728 — just to leave. On larger agreements this can be thousands of dollars.`,
    negotiation: `Push hard to remove the minimum billing clause entirely, or reduce it to 50% of the current invoice (not agreement value). For the cancellation penalty, negotiate it down to a flat fee or a maximum cap. Never agree to "agreement value × weeks remaining" without a hard dollar ceiling.`,
    action: "draft-email",
    actionLabel: "Draft: Negotiate Cancellation Terms",
    emailSubject: "Request to Modify Minimum Billing & Cancellation Penalty",
    emailBody: `Dear [Vendor Representative],

After reviewing the service agreement, I have concerns about the minimum billing and cancellation provisions that I'd like to address before signing.

Specifically, I'd like to negotiate the following:
1. Minimum billing: Reduce from 80% of agreement value to 50% of the current invoice amount, reflecting actual usage.
2. Cancellation penalty: Cap the early termination fee at a maximum of $[X], regardless of weeks remaining. Alternatively, accept a 30-day notice period as sufficient to cancel without penalty after the initial term.

These modifications bring the agreement into a more standard and fair structure. I'm committed to a strong long-term relationship but need these protections in place.

Thank you for your consideration,
[Your Name]
[Business Name]`,
  },
  {
    id: "finance-charges",
    label: "Finance Charges & Attorney Fees",
    risk: "medium",
    contractText: `Customer agrees to pay attorney's fees in the amount of 15% of monies due and any other cost necessary to collect monies due. The price in effect may be changed by Company annually and/or otherwise from time to time. A finance charge of 1 1/2% per month, which is equal to 18% per year will be added to all balances not paid within terms. If credit terms are allowed, customer agrees to pay balance due to Company within ten (10) days after the end of the month that said invoices are dated, payable by ACH or check.`,
    title: "Finance Charges, Price Increases & Attorney Fees",
    risk_label: "Watch This Closely",
    explanation: `Three important things buried in this clause:\n\n1. PRICE INCREASES: The vendor can raise your prices "annually and/or otherwise from time to time" — meaning at any time, with no specific notice required. Your weekly invoice is technically the notice. This is how vendors quietly add 5-10% per year without a formal notification.\n\n2. FINANCE CHARGE: Unpaid balances accrue at 18% annually (1.5%/month). Pay on time — this adds up fast.\n\n3. ATTORNEY FEES: If they send your account to collections, you owe an additional 15% of the balance in attorney fees on top of what you already owe.`,
    negotiation: `Add language capping annual price increases to a fixed percentage (e.g., "prices shall not increase more than 3% per year" or "increases shall not exceed CPI"). You can write directly on the agreement: "all additional charges below are good for the term of the agreement." Regarding payment terms, 10 days is tight — try to negotiate net 30.`,
    action: "draft-email",
    actionLabel: "Draft: Request Price Increase Cap",
    emailSubject: "Request to Cap Annual Price Increases",
    emailBody: `Dear [Vendor Representative],

I'd like to address the price adjustment language in our service agreement before we finalize terms.

The current language allows for price increases at any time with the invoice serving as notice. I'd like to add the following language:

"The Company agrees that all pricing, service charges, and fees listed in this agreement shall not increase by more than [3%] per calendar year during the initial term of this agreement. Any proposed increase beyond this cap requires 60 days written notice."

This is a reasonable protection that allows us to plan and budget appropriately. Please confirm this can be included.

Best regards,
[Your Name]
[Business Name]`,
  },
  {
    id: "service-charge",
    label: "Service Charge",
    risk: "medium",
    contractText: `Service Charge — $10.00 weekly. [Line item on agreement: IMGSERVICECH — Service Charge, $10.00 weekly total]`,
    title: "Service Charge",
    risk_label: "Negotiate This Down",
    explanation: `The service charge is a weekly flat fee added on top of your rental costs — it covers route servicing, delivery, pick-up, and administrative costs. It sounds small ($10/week = $520/year) but it is typically the first line item vendors increase each year.\n\nThis is pure margin for the vendor. There is no law of nature that says this fee has to exist at all, and it is absolutely negotiable — especially on new accounts where you have the most leverage.`,
    negotiation: `Start by asking for the service charge to be waived entirely or set at $0 for the first year. If they won't budge, push to have it locked at the current rate for the full term of the agreement with no annual increases. A good opening position: "We'll sign today if the service charge is $0 for the initial term."`,
    action: "draft-email",
    actionLabel: "Draft: Request Service Charge Waiver",
    emailSubject: "Request to Waive or Freeze Service Charge",
    emailBody: `Dear [Vendor Representative],

As we finalize our service agreement, I'd like to address the weekly service charge.

I'd like to request one of the following:
Option A: Waive the service charge entirely for the initial term of the agreement.
Option B: Lock the service charge at the current rate of $[X]/week for the full term of the agreement with no annual increases.

The service charge is a significant line item when calculated over the agreement term, and freezing or removing it would go a long way toward making this a long-term partnership.

Thank you,
[Your Name]
[Business Name]`,
  },
  {
    id: "ldp-protection",
    label: "LDP Protection Charge",
    risk: "medium",
    contractText: `LOSSPROTECT 2.16% — LDP Protection — $1.28 weekly [Line item: 1(1) at $1.40 per week on invoice]`,
    title: "LDP (Loss Damage Protection)",
    risk_label: "Optional — You Can Refuse",
    explanation: `LDP (Loss Damage Protection) is essentially an insurance product the vendor sells you on top of your rental fees. It's supposed to cover you if items are lost or damaged beyond normal wear.\n\nHere's the catch: you're already protected for "normal wear" under the base rental agreement. LDP only kicks in for losses BEYOND that — and the vendor still decides what qualifies. This is a profit center for the vendor, not a genuine protection for you.\n\nThis maps to the Automatic Lost Replacement (LR) charge concept — whether you actually lose or damage items, you're paying this fee every single week automatically.`,
    negotiation: `You do not have to accept this charge. Tell your sales rep you want to track actual losses weekly and pay only for what you actually lose. Alternatively, ask to have this clause removed entirely. The vendor wants your business — they will often drop optional charges rather than lose the account.`,
    action: "draft-email",
    actionLabel: "Draft: Remove LDP Charge",
    emailSubject: "Request to Remove LDP Protection Charge",
    emailBody: `Dear [Vendor Representative],

I'd like to discuss the LDP Protection charge included in our service agreement.

After reviewing this charge, I'd like to request that it be removed from our agreement. I prefer to track any actual item losses or damage on a weekly basis and address them individually as they occur, rather than paying a blanket weekly protection fee.

If this charge cannot be removed entirely, I'd like to negotiate the following:
- LDP is only applied to items that are actually reported as lost or damaged that week.
- The replacement rate for lost items is capped at [X]% of the weekly rental fee for that item.

Please advise how we can proceed.

Thank you,
[Your Name]
[Business Name]`,
  },
  {
    id: "arbitration",
    label: "Arbitration & Jury Waiver",
    risk: "high",
    contractText: `Any action against Company by customer under or related to this agreement must be brought within twelve (12) months after the cause of action accrues. Any dispute or matter arising in connection with or relating to this agreement shall be resolved by binding and final arbitration in Philadelphia, PA under applicable state or federal laws providing for the enforcement of agreements to arbitrate disputes. Any such dispute shall be determined on an individual basis, shall be considered unique as to its facts, and shall not be consolidated in any arbitration or other proceeding with any claim or controversy of any other party.\n\nSubject to the mandatory arbitration provisions set forth herein, the parties hereby expressly waive the right to a trial by jury in any action or proceeding brought by or against either of them relating to this agreement.`,
    title: "Arbitration Clause & Jury Trial Waiver",
    risk_label: "High Risk — Read Before Signing",
    explanation: `This clause has two major implications:\n\n1. ARBITRATION: If you have a dispute with the vendor, you cannot sue them in your local court. Instead, you must go to binding arbitration in Philadelphia, PA — regardless of where your business is located. You pay your own costs to get there and participate. The arbitration decision is final and cannot be appealed.\n\n2. JURY WAIVER: You are explicitly giving up your constitutional right to a jury trial. This is a significant legal right you are signing away. The 12-month statute of limitations is also shorter than most state laws allow.\n\nThis clause is written entirely to protect the vendor, not you. READ THE TERMS AND CONDITIONS on the back of any agreement BEFORE signing.`,
    negotiation: `You can try to strike this clause or modify the venue to your local jurisdiction. At minimum, ask for the arbitration location to be changed to your state. Some vendors will agree to mutual arbitration (either party can initiate) rather than one-sided. If the vendor won't budge, at least make sure you understand what you're agreeing to before signing.`,
    action: "draft-email",
    actionLabel: "Draft: Request Arbitration Modification",
    emailSubject: "Request to Modify Arbitration Clause",
    emailBody: `Dear [Vendor Representative],

I've reviewed the arbitration and dispute resolution clause in our service agreement and have the following concerns I'd like to address before signing.

The current clause requires all disputes to be resolved through binding arbitration in Philadelphia, PA, which presents a practical hardship for our business located in [Your State/City].

I'd like to request the following modifications:
1. Arbitration venue be changed to [Your State] or conducted via video conference.
2. The 12-month statute of limitations be extended to match [Your State]'s standard limitation period.
3. Either party may initiate arbitration proceedings, not just the customer.

I understand arbitration is your preferred resolution method and I'm open to that process with these reasonable modifications to the location and timing requirements.

Thank you,
[Your Name]
[Business Name]`,
  },
  {
    id: "governing-law",
    label: "Governing Law & Successors",
    risk: "low",
    contractText: `This agreement shall be binding upon present and or future owners, successors or assigns of customer and Company. Customer warrants that it is not a party to any other contracts with other textile rental companies for the same service. If any of the provisions of this agreement are held by a court of competent jurisdiction to be unenforceable, then such provisions shall be limited or eliminated to the minimum extent necessary so that this agreement shall otherwise remain in full force and effect. This agreement is the entire agreement between the parties and supersedes all prior or contemporaneous understandings, oral or written. No modification of this agreement will be binding unless in writing and signed by Company. This agreement shall be governed by the laws of the Commonwealth of Pennsylvania without regard to its choice of law rules.`,
    title: "Governing Law, Successors & Entire Agreement",
    risk_label: "Be Aware",
    explanation: `Several important points in this clause:\n\n1. BINDING ON SUCCESSORS: If you sell your business, the new owner inherits this contract. And if the vendor is acquired, the new company inherits it too. Make sure any business sale accounts for existing vendor agreements.\n\n2. EXCLUSIVITY: You are warranting (guaranteeing) that you don't have another uniform/linen contract with a competitor. If you do, disclose it.\n\n3. NO ORAL AGREEMENTS: Anything your sales rep promised verbally that isn't written in this document doesn't exist legally. If they said "we'll waive the service charge" or "we'll give you free emblems" — it MUST be in writing.\n\n4. PENNSYLVANIA LAW: All legal matters are governed by Pennsylvania law regardless of where your business operates.`,
    negotiation: `The most important takeaway: get everything in writing. Use the "Other" or addendum section of any agreement to capture every verbal commitment made during sales negotiations. Before signing, make a list of everything the sales rep promised and confirm each one is reflected in the agreement text.`,
    action: "checklist",
    actionLabel: "Pre-Signing Checklist",
    checklist: [
      "Every verbal promise from the sales rep is written into the agreement or an addendum",
      "You have no conflicting contracts with other uniform vendors",
      "You understand the agreement will bind any future owner of your business",
      "You have a copy of the full agreement including all terms and conditions on the back",
      "You have noted the auto-renewal date and set a calendar reminder 95 days before it",
    ],
  },
];

// ─────────────────────────────────────────
// SHARED UI
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

function Btn({ children, onClick, variant = "navy", full = false, size = "md", disabled = false }) {
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
      style={{ ...sz, ...th, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", opacity: disabled ? 0.5 : 1, width: full ? "100%" : "auto" }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >{children}</button>
  );
}

if", fontSize: 14, fontWeight: 500, padding: "9px 20px", borderRadius: 8, textDecoration: "none" }}>Get Started</a>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────
// PRE-PURCHASE PAGE
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
            <Btn variant="teal" size="lg" onClick={onPurchase}>Get Instant Access — $49.99 →</Btn>
            <a href="#preview" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 500, padding: "15px 32px", borderRadius: 9, textDecoration: "none" }}>
              See a preview ↓
            </a>
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
            One-time purchase · Instant access · Works for Cintas, UniFirst, ALSCO, ImageFirst & more
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
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
              Click a clause on the left to see the plain-English explanation, risk level, and recommended action on the right. One clause is free — the rest unlock after purchase.
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 460 }}>
              {/* Left: contract */}
              <div style={{ borderRight: `1px solid ${C.gray200}`, padding: "28px 28px 0" }}>
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
                  <Btn variant="teal" onClick={onPurchase}>Get Full Access — $49.99</Btn>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>
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
              One payment. Instant access. The knowledge that could save you thousands every year.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Btn variant="teal" size="lg" onClick={onPurchase}>Get Instant Access — $49.99</Btn>
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 14 }}>
              Satisfaction guaranteed · No subscription · Instant access after purchase
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
function EmailModal({ clause, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `Subject: ${clause.emailSubject}\n\n${clause.emailBody}`;
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(8,30,56,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.white, borderRadius: 18, width: "100%", maxWidth: 620, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(12,45,84,0.25)", animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
        {/* Header */}
        <div style={{ background: C.navy, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.blueLight, marginBottom: 3 }}>Negotiation Email</div>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: "#fff" }}>{clause.emailSubject}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          <div style={{ background: C.bluePale, border: `1px solid rgba(61,128,200,0.2)`, borderRadius: 10, padding: "12px 16px", marginBottom: 18, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.blueMid, lineHeight: 1.6 }}>
            💡 Customize the bracketed fields before sending. This email is designed to open a negotiation — most vendors will respond rather than risk losing your business.
          </div>
          <div style={{ background: C.offWhite, border: `1px solid ${C.gray200}`, borderRadius: 10, padding: "20px" }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: C.gray500, marginBottom: 12 }}>Subject: {clause.emailSubject}</div>
            <pre style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.gray700, lineHeight: 1.75, whiteSpace: "pre-wrap", margin: 0 }}>{clause.emailBody}</pre>
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: "18px 24px", borderTop: `1px solid ${C.gray200}`, display: "flex", gap: 12, flexShrink: 0 }}>
          <Btn variant={copied ? "tealOutline" : "teal"} onClick={copy} full>
            {copied ? "✓ Copied to clipboard!" : "Copy to Clipboard"}
          </Btn>
          <Btn variant="ghost" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// CHECKLIST MODAL
// ─────────────────────────────────────────
function ChecklistModal({ clause, onClose }) {
  const [checked, setChecked] = useState({});
  const toggle = i => setChecked(c => ({ ...c, [i]: !c[i] }));
  const allDone = clause.checklist.every((_, i) => checked[i]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(8,30,56,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.white, borderRadius: 18, width: "100%", maxWidth: 520, overflow: "hidden", boxShadow: "0 24px 80px rgba(12,45,84,0.25)", animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
        <div style={{ background: C.navy, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: "#fff" }}>Pre-Signing Checklist</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 300, color: C.gray500, lineHeight: 1.7, marginBottom: 24 }}>
            Check off each item before you sign. Everything on this list should be confirmed in writing.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {clause.checklist.map((item, i) => (
              <div key={i} onClick={() => toggle(i)} style={{ display: "flex", gap: 14, alignItems: "flex-start", cursor: "pointer", padding: "12px 14px", borderRadius: 10, background: checked[i] ? C.tealLight : C.offWhite, border: `1px solid ${checked[i] ? C.teal : C.gray200}`, transition: "all 0.2s" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked[i] ? C.teal : C.gray300}`, background: checked[i] ? C.teal : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                  {checked[i] && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: checked[i] ? "#0D6E52" : C.gray700, lineHeight: 1.6, paddingTop: 1, textDecoration: checked[i] ? "line-through" : "none", transition: "all 0.2s" }}>{item}</div>
              </div>
            ))}
          </div>
          {allDone && (
            <div style={{ background: C.tealLight, border: `1px solid ${C.teal}`, borderRadius: 10, padding: "14px 16px", textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#0D6E52", fontWeight: 500 }}>
              ✓ All items confirmed — you're ready to review and sign!
            </div>
          )}
          <Btn variant="ghost" full onClick={onClose} style={{ marginTop: 14 }}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// POST-PURCHASE: DEMYSTIFIER SPLIT SCREEN
// ─────────────────────────────────────────
function DemystifierApp() {
  const [activeId, setActiveId]   = useState("rental-terms");
  const [modal, setModal]         = useState(null); // "email" | "checklist" | null
  const [progress, setProgress]   = useState({});
  const active = CLAUSES.find(c => c.id === activeId) || CLAUSES[0];

  const markRead = id => setProgress(p => ({ ...p, [id]: true }));

  const handleSelect = id => {
    setActiveId(id);
    markRead(id);
  };

  const doneCount = Object.keys(progress).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.offWhite }}>

      {/* App toolbar */}
      <div style={{ background: C.navy, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.blueLight }}>My</span>
            <div>
              <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 17, color: "#fff" }}>Contract </span>
              <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 17, fontStyle: "italic", color: C.blueLight }}>Doctors</span>
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>The Demystifier</div>
          <Tag variant="teal">Sample Agreement — ImageFirst</Tag>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            {doneCount} of {CLAUSES.length} clauses reviewed
          </div>
          <div style={{ width: 120, height: 5, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${(doneCount / CLAUSES.length) * 100}%`, height: "100%", background: C.teal, borderRadius: 3, transition: "width 0.4s ease" }} />
          </div>
          <Btn variant="teal" size="sm" onClick={() => window.location.reload()}>Upload My Agreement →</Btn>
        </div>
      </div>

      {/* Main split */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 1fr", flex: 1, overflow: "hidden" }}>

        {/* ── Column 1: Clause index ── */}
        <div style={{ background: C.white, borderRight: `1px solid ${C.gray200}`, overflowY: "auto" }}>
          <div style={{ padding: "16px 18px 8px", borderBottom: `1px solid ${C.gray100}` }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gray500 }}>Agreement clauses</div>
          </div>
          {CLAUSES.map(clause => {
            const isActive = clause.id === activeId;
            const isDone   = progress[clause.id];
            const riskColor = { high: C.red, medium: C.amber, low: C.green }[clause.risk];
            return (
              <div key={clause.id} onClick={() => handleSelect(clause.id)} style={{ padding: "13px 18px", cursor: "pointer", borderBottom: `1px solid ${C.gray100}`, background: isActive ? C.bluePale : "transparent", borderLeft: isActive ? `3px solid ${C.blue}` : "3px solid transparent", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor, flexShrink: 0 }} />
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? C.navy : C.gray700, lineHeight: 1.3 }}>{clause.label}</div>
                  {isDone && <span style={{ marginLeft: "auto", fontSize: 11, color: C.teal }}>✓</span>}
                </div>
              </div>
            );
          })}
          {/* Risk legend */}
          <div style={{ padding: "16px 18px", borderTop: `1px solid ${C.gray100}`, marginTop: 8 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.gray500, marginBottom: 10 }}>Risk level</div>
            {[{ color: C.red, label: "High — Negotiate hard" }, { color: C.amber, label: "Medium — Review closely" }, { color: C.green, label: "Low — Be aware" }].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.gray500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Column 2: Contract text ── */}
        <div style={{ background: "#FAFAF8", borderRight: `1px solid ${C.gray200}`, overflowY: "auto", padding: "24px" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gray500, marginBottom: 16 }}>Contract language</div>

          {/* Contract header (always visible) */}
          <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 10, padding: "16px 18px", marginBottom: 16, opacity: 0.7 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: C.gray500 }}>VENDOR</div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: C.navy }}>Berstein-Magoon-Gay, LLC (ImageFirst)</div></div>
              <div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: C.gray500 }}>CUSTOMER</div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: C.navy }}>Ragged Coast Chocolates</div></div>
              <div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: C.gray500 }}>CONTRACT #</div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: C.navy }}>63-JL00212</div></div>
              <div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: C.gray500 }}>WEEKLY VALUE</div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: C.navy }}>$70.53</div></div>
            </div>
          </div>

          {/* All clauses — active one highlighted */}
          {CLAUSES.map(clause => {
            const isActive = clause.id === activeId;
            return (
              <div key={clause.id} onClick={() => handleSelect(clause.id)}
                style={{
                  borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: "pointer",
                  background: isActive ? C.bluePale : C.white,
                  border: isActive ? `2px solid ${C.blue}` : `1px solid ${C.gray200}`,
                  transition: "all 0.2s",
                  boxShadow: isActive ? `0 4px 16px rgba(61,128,200,0.15)` : "none",
                }}>
                <div style={{ display: "flex", align: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: isActive ? C.blue : C.gray500 }}>{clause.label}</div>
                  <RiskBadge risk={clause.risk} />
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: isActive ? C.navy : C.gray700, lineHeight: 1.7, fontStyle: "normal" }}>
                  {clause.contractText.length > 220 && !isActive
                    ? clause.contractText.slice(0, 220) + "..."
                    : clause.contractText}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Column 3: Glossary panel ── */}
        <div style={{ overflowY: "auto", padding: "24px", background: C.offWhite }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gray500, marginBottom: 16 }}>Plain-English explanation</div>

          {/* Risk + Title */}
          <div style={{ marginBottom: 16 }}>
            <RiskBadge risk={active.risk} />
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, color: C.navy, margin: "12px 0 4px", lineHeight: 1.2 }}>{active.title}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: { high: C.red, medium: C.amber, low: C.green }[active.risk] }}>{active.risk_label}</div>
          </div>

          {/* Explanation */}
          <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.gray500, marginBottom: 10 }}>What this means for you</div>
            {active.explanation.split("\n\n").map((para, i) => (
              <p key={i} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 300, color: C.gray700, lineHeight: 1.8, marginBottom: i < active.explanation.split("\n\n").length - 1 ? 12 : 0 }}>{para}</p>
            ))}
          </div>

          {/* Negotiation advice */}
          <div style={{ background: C.amberLight, border: `1px solid ${C.amber}`, borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.amber, marginBottom: 8 }}>How to negotiate this</div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 300, color: C.gray700, lineHeight: 1.75, margin: 0 }}>{active.negotiation}</p>
          </div>

          {/* Action */}
          {active.action === "draft-email" && (
            <div style={{ background: C.navy, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.blueLight, marginBottom: 8 }}>Take action</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: 14 }}>We've drafted a negotiation email you can copy and send directly to your vendor.</div>
              <Btn variant="teal" full onClick={() => setModal("email")}>✉️ {active.actionLabel}</Btn>
            </div>
          )}
          {active.action === "checklist" && (
            <div style={{ background: C.navy, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.blueLight, marginBottom: 8 }}>Take action</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: 14 }}>Work through this checklist before signing anything.</div>
              <Btn variant="teal" full onClick={() => setModal("checklist")}>📋 {active.actionLabel}</Btn>
            </div>
          )}

          {/* Next clause nudge */}
          {CLAUSES.findIndex(c => c.id === activeId) < CLAUSES.length - 1 && (
            <button onClick={() => { const idx = CLAUSES.findIndex(c => c.id === activeId); handleSelect(CLAUSES[idx + 1].id); }}
              style={{ marginTop: 16, width: "100%", background: "none", border: `1px solid ${C.gray300}`, borderRadius: 10, padding: "11px 16px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, color: C.gray500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.gray300}>
              <span>Next: {CLAUSES[CLAUSES.findIndex(c => c.id === activeId) + 1].label}</span>
              <span>→</span>
            </button>
          )}

          {/* Invoice upsell */}
          {doneCount >= 3 && (
            <div style={{ marginTop: 20, background: C.tealLight, border: `1px solid ${C.teal}`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: "#0D6E52", marginBottom: 6 }}>Ready to go deeper?</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 300, color: C.gray700, lineHeight: 1.6, marginBottom: 12 }}>Now upload your actual invoice and see exactly how much you're overpaying on each line item.</div>
              <Btn variant="teal" size="sm" full>Analyze My Invoice — Free →</Btn>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal === "email"     && <EmailModal     clause={active} onClose={() => setModal(null)} />}
      {modal === "checklist" && <ChecklistModal clause={active} onClose={() => setModal(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────
// ROOT — toggles between pre/post purchase
// ─────────────────────────────────────────
export default function DemystifierPage() {
  const [purchased, setPurchased] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cardNum, setCardNum] = useState("");

  const handlePurchase = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setShowPayment(false); setPurchased(true); }, 2000);
  };

  if (purchased) {
    return (
      <>
        <style>{`${FONTS} *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;} body{background:${C.offWhite};} @keyframes popIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <DemystifierApp />
      </>
    );
  }

  return (
    <>
      <style>{`${FONTS} *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;} html{scroll-behavior:smooth;} body{background:${C.offWhite};} @keyframes popIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <PrePurchasePage onPurchase={() => setShowPayment(true)} />

      {/* Payment modal */}
      {showPayment && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(8,30,56,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget && !processing) setShowPayment(false); }}>
          <div style={{ background: C.white, borderRadius: 20, padding: 40, maxWidth: 440, width: "100%", boxShadow: "0 24px 80px rgba(12,45,84,0.25)", animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
            {!processing ? <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <Tag variant="teal">One-time purchase</Tag>
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: C.navy, margin: "10px 0 4px" }}>The Demystifier</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.gray500 }}>Instant access · All 8 clauses · Email drafts included</div>
                </div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 36, color: C.navy }}>$49<span style={{ fontSize: 18 }}>.99</span></div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6, display: "block" }}>Card number</label>
                  <input value={cardNum} onChange={e => setCardNum(e.target.value.replace(/\D/g, "").slice(0, 16))} placeholder="1234 5678 9012 3456"
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.navy, outline: "none" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6, display: "block" }}>Expiry</label>
                    <input placeholder="MM / YY" style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.navy, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 6, display: "block" }}>CVC</label>
                    <input placeholder="123" style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${C.gray300}`, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.navy, outline: "none" }} />
                  </div>
                </div>
              </div>

              <Btn variant="teal" full size="lg" onClick={handlePurchase}>Pay $49.99 — Get Instant Access</Btn>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.gray500, textAlign: "center", marginTop: 12 }}>🔒 Secure checkout · Satisfaction guaranteed · No subscription</div>
              <button onClick={() => setShowPayment(false)} style={{ marginTop: 10, width: "100%", background: "none", border: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.gray500, cursor: "pointer", textDecoration: "underline" }}>Cancel</button>
            </> : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 48, height: 48, border: `3px solid ${C.bluePale}`, borderTopColor: C.teal, borderRadius: "50%", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, color: C.navy, marginBottom: 8 }}>Processing payment...</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.gray500 }}>Setting up your access to The Demystifier</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
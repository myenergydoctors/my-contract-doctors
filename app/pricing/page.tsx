import Link from "next/link";
import FaqSchema from "@/components/seo/FaqSchema";
import ProductSchema from "@/components/seo/ProductSchema";
import PlansGrid from "./PlansGrid";

export const metadata = {
  title: "Pricing",
  description: "Free to start with one confirmed invoice opportunity and one agreement-clause preview. $29/month Pro includes ongoing monitoring. $49 one-time for a full Agreement review.",
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Confirm your first invoice and first agreement to see one supported preview from each when the document contains enough evidence.",
    cta: "Start free",
    ctaHref: "/sign-up?redirect=%2Finvoice",
    features: [
      "1 confirmed invoice",
      "1 evidence-backed opportunity",
      "1 agreement clause preview",
      "Customer correction and totals check",
      "Email support",
    ],
    missing: [
      "Full savings breakdown",
      "Full contract analysis",
      "Industry insights",
      "Dispute letters & negotiation emails",
    ],
  },
  {
    id: "agreement",
    name: "Agreement",
    price: "$49",
    cadence: "one-time per agreement",
    description: "A complete, personalized analysis of one specific contract.",
    cta: "Analyze my contract",
    ctaHref: "/agreement",
    features: [
      "Full clause-by-clause breakdown",
      "Risk score and priority actions",
      "Negotiation email drafts",
      "Lifetime access to that analysis",
      "Unlimited dispute letters for this contract",
    ],
    missing: [
      "Industry Insights dashboard",
      "Ongoing invoice monitoring",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    cadence: "per month",
    description: "For businesses that want ongoing invoice monitoring and repeated reviews.",
    cta: "Start Pro plan",
    ctaHref: "/checkout/pro",
    highlighted: true,
    features: [
      "Up to 5 new invoice analyses per month",
      "1 agreement credit per quarter",
      "Industry Insights where data thresholds are met",
      "Priority dispute letter generation",
      "Quarterly contract review reminders",
      "Auto-renewal alerts (90 days before)",
      "All future modules included",
    ],
    missing: [],
  },
];

const comparison = [
  { feature: "Invoice analysis", free: "1 confirmed invoice", agreement: "—", pro: "Up to 5/month" },
  { feature: "Contract analysis", free: "1 clause preview", agreement: "1 full contract", pro: "1 full credit/quarter" },
  { feature: "Industry Insights dashboard", free: "—", agreement: "—", pro: "✓" },
  { feature: "Dispute letter templates", free: "—", agreement: "✓", pro: "✓" },
  { feature: "Negotiation email drafts", free: "—", agreement: "✓", pro: "✓" },
  { feature: "Auto-renewal alerts", free: "—", agreement: "—", pro: "✓" },
  { feature: "Quarterly review reminders", free: "—", agreement: "—", pro: "✓" },
  { feature: "Email support", free: "✓", agreement: "✓", pro: "Priority" },
  { feature: "Future modules", free: "—", agreement: "—", pro: "Included" },
];

const faqs = [
  { q: "Is there a trial for the Pro plan?", a: "The Free plan lets you confirm your first invoice and agreement and see one supported preview from each when the documents contain enough verified information. Upgrade when you want the full analysis and ongoing monitoring." },
  { q: "What if I'm not sure which plan I need?", a: "Most businesses start by uploading an invoice on the Free plan to see what we find. If we identify enough savings to make Pro a no-brainer (we usually do), you can upgrade right from your dashboard." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your billing settings at any time. You'll retain access through the end of your billing period. We don't lock you into annual contracts." },
  { q: "What about the one-time Agreement purchase?", a: "Agreement is for businesses who just want one contract analyzed without committing to a subscription. You pay $49, get the full analysis with negotiation emails and dispute letters, and keep lifetime access to that report." },
  { q: "Do you offer team or enterprise pricing?", a: "Yes — if you manage multiple locations, franchises, or facilities, contact us for volume pricing. We work with everything from single restaurants to multi-state hospital systems." },
];

export default function PricingPage() {
  return (
    <>
      <FaqSchema items={faqs} />
      <ProductSchema
        name="Pro plan — My Contract Doctors"
        description="Ongoing uniform and linen invoice monitoring with up to five new invoice analyses per month, saved history, and eligible alerts."
        price={29}
        url="/pricing"
      />
      <ProductSchema
        name="Agreement analysis — My Contract Doctors"
        description="Full personalized analysis of one specific uniform or linen service agreement, including clause-by-clause breakdown and negotiation emails."
        price={49}
        url="/pricing"
      />
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark to-navy px-6 md:px-8 pt-28 md:pt-36 pb-16 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-teal block mb-4">Pricing</span>
          <h1 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(32px,4.5vw,52px)" }}>
            Fair pricing for fair contracts.<br />
            <em className="italic text-blue-light">Understand a real invoice, line by line.</em>
          </h1>
          <p className="font-sans font-light text-white/70 leading-relaxed text-base md:text-lg">
            Confirm your first invoice and see one evidence-backed opportunity. Upgrade when you want ongoing reviews.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-off-white">
        <div className="max-w-6xl mx-auto">
          <PlansGrid
            free={plans[0]}
            agreement={plans[1]}
            proPlanBase={plans[2]}
            proMonthly={{ price: "$29", cadence: "per month", ctaHref: "/checkout/pro" }}
            proAnnual={{ price: "$313.20", cadence: "billed yearly", effectiveMonthly: "$26.10", savings: "Save $34.80 vs paying monthly", ctaHref: "/checkout/pro-annual" }}
          />
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Compare plans</span>
            <h2 className="font-serif text-navy leading-tight" style={{ fontSize: "clamp(26px,3.5vw,38px)" }}>What's in each plan</h2>
          </div>
          <div className="bg-off-white border border-gray-200 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="text-left px-5 py-4 font-sans text-xs font-semibold uppercase tracking-wider text-white/70">Feature</th>
                  <th className="text-center px-5 py-4 font-sans text-sm">Free</th>
                  <th className="text-center px-5 py-4 font-sans text-sm">Agreement</th>
                  <th className="text-center px-5 py-4 font-sans text-sm bg-teal/20">Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.feature} className={`border-t border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-off-white"}`}>
                    <td className="px-5 py-3 font-sans text-sm text-navy">{row.feature}</td>
                    <td className="px-5 py-3 text-center font-sans text-sm text-gray-500">{row.free}</td>
                    <td className="px-5 py-3 text-center font-sans text-sm text-gray-500">{row.agreement}</td>
                    <td className="px-5 py-3 text-center font-sans text-sm text-navy font-medium bg-teal/5">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-off-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Pricing FAQ</span>
            <h2 className="font-serif text-navy leading-tight" style={{ fontSize: "clamp(26px,3.5vw,38px)" }}>Questions you probably have</h2>
          </div>
          <div className="flex flex-col gap-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-serif text-navy text-lg mb-2">{q}</h3>
                <p className="font-sans font-light text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-8 py-20 md:py-28 bg-gradient-to-br from-navy to-navy-dark text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(28px,4vw,44px)" }}>
            Find your first $1,000 in savings.<br />
            <em className="italic text-blue-light">It's free to start.</em>
          </h2>
          <p className="font-sans font-light text-white/70 leading-relaxed mb-8">
            Upload one invoice. We'll show you exactly where you're overpaying. Decide if it's worth more from there.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/invoice" className="font-sans text-sm font-medium bg-teal text-white px-6 py-3 rounded-lg no-underline hover:opacity-90 transition-opacity">
              Upload an invoice — free
            </Link>
            <Link href="/contact" className="font-sans text-sm font-medium bg-white/10 border border-white/20 text-white px-6 py-3 rounded-lg no-underline hover:bg-white/20 transition-colors">
              Talk to us first
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

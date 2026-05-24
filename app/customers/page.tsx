import Link from "next/link";
import { caseStudies } from "@/lib/case-studies";

export const metadata = { title: "Customers | My Contract Doctors" };

export default function CustomersPage() {
  const totalSavings = caseStudies.reduce((s, c) => s + c.annualSavings, 0);
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark to-navy px-6 md:px-8 pt-28 md:pt-36 pb-16 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-teal block mb-4">Customer stories</span>
          <h1 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(32px,4.5vw,52px)" }}>
            What we've found.<br />
            <em className="italic text-blue-light">In real contracts.</em>
          </h1>
          <p className="font-sans font-light text-white/70 leading-relaxed text-base md:text-lg">
            A few of the businesses we've helped audit, dispute, and renegotiate. The numbers below are pulled from actual customer outcomes.
          </p>
        </div>
      </section>

      {/* Big stat */}
      <section className="px-6 md:px-8 py-12 md:py-16 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-serif text-teal text-5xl md:text-6xl mb-2">${(totalSavings / 1000).toFixed(0)}K</div>
          <div className="font-sans font-light text-gray-500 leading-relaxed max-w-xl mx-auto">
            in annualized savings from just the three customers below. Each chose to share their story so other businesses know what's possible.
          </div>
        </div>
      </section>

      {/* Case study cards */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-off-white">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          {caseStudies.map((c, i) => (
            <Link
              key={c.slug}
              href={`/customers/${c.slug}`}
              className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue hover:shadow-lg transition-all no-underline"
            >
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]">
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-blue-pale text-blue px-2 py-1 rounded">Customer story #{i + 1}</span>
                    <span className="font-sans text-xs text-gray-500">{c.businessType}</span>
                  </div>
                  <h2 className="font-serif text-navy text-xl md:text-2xl leading-tight mb-3">{c.headline}</h2>
                  <p className="font-sans font-light text-gray-500 text-sm md:text-base leading-relaxed mb-4">{c.subhead}</p>
                  <div className="flex items-center gap-2 font-sans text-sm text-blue">
                    Read the full story <span>→</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-navy to-navy-dark text-white p-6 md:p-8 flex flex-col justify-center">
                  <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue-light mb-2">Annual savings</div>
                  <div className="font-serif text-teal text-3xl md:text-4xl mb-3">${c.annualSavings.toLocaleString()}</div>
                  <div className="font-sans text-xs text-white/60 mb-1">Vendor: <span className="text-white/85">{c.vendor}</span></div>
                  <div className="font-sans text-xs text-white/60">Reduction: <span className="text-white/85">{c.reductionPct}% off base spend</span></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-8 py-20 md:py-28 bg-gradient-to-br from-navy to-navy-dark text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(28px,4vw,44px)" }}>
            See what we'd find in <em className="italic text-blue-light">your</em> contract.
          </h2>
          <p className="font-sans font-light text-white/70 leading-relaxed mb-8">
            Upload one invoice and we'll show you exactly where you're overpaying. First recommendation is free, no card required.
          </p>
          <Link href="/invoice" className="inline-block font-sans text-base font-medium bg-teal text-white px-6 py-3 rounded-lg no-underline hover:opacity-90 transition-opacity">
            Upload an invoice — free
          </Link>
        </div>
      </section>
    </>
  );
}

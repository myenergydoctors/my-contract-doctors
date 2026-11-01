import { BrandHero } from "@/components/marketing/BrandSections";
import brand from "@/components/marketing/BrandSections.module.css";
import Link from "next/link";
import { caseStudies } from "@/lib/case-studies";

export const metadata = { title: "Customers | My Contract Doctors" };

export default function CustomersPage() {
  const totalSavings = caseStudies.reduce((s, c) => s + c.annualSavings, 0);
  return (
    <main className={brand.page}>
      <BrandHero
        eyebrow="Customer stories"
        title={
          <>
            A closer look.
            <br />
            <em>A different outcome.</em>
          </>
        }
        description="Explore the businesses, agreement reviews, and vendor conversations behind these customer stories."
        image="bakery"
        caption="The everyday expenses that deserve a closer look."
        actions={
          <Link href="/reviews" className={brand.primary}>
            Read customer reviews ↗
          </Link>
        }
      />

      {/* Big stat */}
      <section className="px-6 md:px-8 py-12 md:py-16 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-serif text-teal text-5xl md:text-6xl mb-2">
            ${(totalSavings / 1000).toFixed(0)}K
          </div>
          <div className="font-sans font-light text-gray-500 leading-relaxed max-w-xl mx-auto">
            in annualized savings from just the three customers below. Each
            chose to share their story so other businesses know what's possible.
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
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-blue-pale text-blue px-2 py-1 rounded">
                      Customer story #{i + 1}
                    </span>
                    <span className="font-sans text-xs text-gray-500">
                      {c.businessType}
                    </span>
                  </div>
                  <h2 className="font-serif text-navy text-xl md:text-2xl leading-tight mb-3">
                    {c.headline}
                  </h2>
                  <p className="font-sans font-light text-gray-500 text-sm md:text-base leading-relaxed mb-4">
                    {c.subhead}
                  </p>
                  <div className="flex items-center gap-2 font-sans text-sm text-blue">
                    Read the full story <span>→</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-navy to-navy-dark text-white p-6 md:p-8 flex flex-col justify-center">
                  <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue-light mb-2">
                    Annual savings
                  </div>
                  <div className="font-serif text-teal text-3xl md:text-4xl mb-3">
                    ${c.annualSavings.toLocaleString()}
                  </div>
                  <div className="font-sans text-xs text-white/60 mb-1">
                    Vendor: <span className="text-white/85">{c.vendor}</span>
                  </div>
                  <div className="font-sans text-xs text-white/60">
                    Reduction:{" "}
                    <span className="text-white/85">
                      {c.reductionPct}% off base spend
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-8 py-20 md:py-28 bg-gradient-to-br from-navy to-navy-dark text-center">
        <div className="max-w-2xl mx-auto">
          <h2
            className="font-serif text-white leading-tight mb-5"
            style={{ fontSize: "clamp(28px,4vw,44px)" }}
          >
            See what we'd find in{" "}
            <em className="italic text-blue-light">your</em> contract.
          </h2>
          <p className="font-sans font-light text-white/70 leading-relaxed mb-8">
            Upload one invoice, confirm the extracted charges, and see the first
            evidence-backed opportunity when the required facts are available.
          </p>
          <Link
            href="/invoice"
            className="inline-block font-sans text-base font-medium bg-teal text-white px-6 py-3 rounded-lg no-underline hover:opacity-90 transition-opacity"
          >
            Upload an invoice — free
          </Link>
        </div>
      </section>
    </main>
  );
}

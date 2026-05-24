import Link from "next/link";
import { getIndustry, industries } from "@/lib/industries";
import { getCaseStudy } from "@/lib/case-studies";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  return { title: ind ? `${ind.name} | My Contract Doctors` : "Industry" };
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ind = getIndustry(slug);
  if (!ind) notFound();
  const cs = ind.caseStudySlug ? getCaseStudy(ind.caseStudySlug) : null;
  const otherIndustries = Object.values(industries).filter(i => i.slug !== ind.slug);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark to-navy px-6 md:px-8 pt-28 md:pt-36 pb-16 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/industries" className="inline-flex items-center font-sans text-sm text-blue-light hover:text-white no-underline mb-6">
            ← All industries
          </Link>
          <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-teal block mb-4">{ind.name}</span>
          <h1 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(32px,4.5vw,52px)" }}>
            {ind.hero}<br />
            <em className="italic text-blue-light">{ind.heroItalic}</em>
          </h1>
          <p className="font-sans font-light text-white/70 leading-relaxed text-base md:text-lg max-w-2xl">
            {ind.intro}
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-6 md:px-8 -mt-8 relative z-20">
        <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl grid grid-cols-1 sm:grid-cols-2 overflow-hidden">
          <div className="p-6 text-center">
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Typical monthly spend</div>
            <div className="font-serif text-navy text-xl md:text-2xl">{ind.avgSpend}</div>
          </div>
          <div className="p-6 text-center sm:border-l border-t sm:border-t-0 border-gray-200 bg-teal/5">
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal mb-2">Typical annual savings</div>
            <div className="font-serif text-teal text-xl md:text-2xl">{ind.avgSavings}</div>
          </div>
        </div>
      </section>

      {/* Top pain points */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-off-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-red block mb-3">What we typically find</span>
            <h2 className="font-serif text-navy leading-tight" style={{ fontSize: "clamp(28px,4vw,40px)" }}>The 4 patterns that hit {ind.shortName} hardest</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ind.topPains.map((p, i) => (
              <div key={p.title} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-red text-white font-sans text-sm font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                  <div>
                    <h3 className="font-serif text-navy text-lg leading-tight mb-2">{p.title}</h3>
                    <p className="font-sans font-light text-gray-500 text-sm leading-relaxed">{p.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendors */}
      <section className="px-6 md:px-8 py-12 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Vendors we audit</span>
          <h3 className="font-serif text-navy text-xl md:text-2xl mb-6">Common providers in this space</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {ind.vendorsCommon.map(v => (
              <span key={v} className="font-sans text-sm bg-off-white border border-gray-200 rounded-full px-4 py-2 text-navy">{v}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Related case study */}
      {cs && (
        <section className="px-6 md:px-8 py-16 md:py-24 bg-off-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-teal block mb-3">Real customer</span>
              <h2 className="font-serif text-navy leading-tight" style={{ fontSize: "clamp(26px,3.5vw,38px)" }}>How we helped a {ind.shortName.replace(/s$/, "")} like yours</h2>
            </div>
            <Link href={`/customers/${cs.slug}`} className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue hover:shadow-lg transition-all no-underline">
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]">
                <div className="p-6 md:p-8">
                  <div className="font-sans text-xs text-gray-500 mb-3">{cs.businessType} · {cs.location}</div>
                  <h3 className="font-serif text-navy text-xl md:text-2xl leading-tight mb-3">{cs.headline}</h3>
                  <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-4">{cs.subhead}</p>
                  <span className="font-sans text-sm font-medium text-blue">Read the full story →</span>
                </div>
                <div className="bg-gradient-to-br from-navy to-navy-dark text-white p-6 md:p-8 flex flex-col justify-center">
                  <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue-light mb-2">Annual savings</div>
                  <div className="font-serif text-teal text-3xl md:text-4xl">${cs.annualSavings.toLocaleString()}</div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Industry FAQ</span>
            <h2 className="font-serif text-navy leading-tight" style={{ fontSize: "clamp(26px,3.5vw,38px)" }}>Common questions</h2>
          </div>
          <div className="flex flex-col gap-4">
            {ind.faqs.map(({ q, a }) => (
              <div key={q} className="bg-off-white border border-gray-200 rounded-2xl p-6">
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
            See what's in <em className="italic text-blue-light">your</em> contracts.
          </h2>
          <p className="font-sans font-light text-white/70 leading-relaxed mb-8">
            Upload one invoice — your first recommendation is free. We'll show you exactly what we'd flag for a business like yours.
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

      {/* Other industries */}
      <section className="px-6 md:px-8 py-12 md:py-16 bg-off-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Other industries</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherIndustries.map(o => (
              <Link key={o.slug} href={`/industries/${o.slug}`} className="block bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue transition-colors no-underline">
                <div className="font-serif text-navy text-lg mb-1">{o.name}</div>
                <div className="font-sans text-sm text-gray-500">Typical savings: <span className="text-teal font-medium">{o.avgSavings}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

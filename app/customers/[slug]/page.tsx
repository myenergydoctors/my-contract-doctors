import Link from "next/link";
import { getCaseStudy } from "@/lib/case-studies";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  return { title: c ? `${c.business} — Customer story | My Contract Doctors` : "Customer story" };
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  if (!c) notFound();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark to-navy px-6 md:px-8 pt-28 md:pt-36 pb-12 md:pb-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/customers" className="inline-flex items-center font-sans text-sm text-blue-light hover:text-white no-underline mb-6">
            ← All customer stories
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal">Customer story</span>
            <span className="font-sans text-xs text-white/50">{c.location}</span>
            <span className="font-sans text-xs text-white/50">·</span>
            <span className="font-sans text-xs text-white/50">{c.businessType}</span>
          </div>
          <h1 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(28px,4vw,46px)" }}>
            {c.headline}
          </h1>
          <p className="font-sans font-light text-white/70 leading-relaxed text-base md:text-lg max-w-2xl">
            {c.subhead}
          </p>
        </div>
      </section>

      {/* Stat strip */}
      <section className="px-6 md:px-8 -mt-8 md:-mt-12 relative z-20">
        <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl grid grid-cols-1 sm:grid-cols-3 overflow-hidden">
          {[
            { label: "Annual savings", value: `$${c.annualSavings.toLocaleString()}`, color: "text-teal" },
            { label: "Of contract value", value: `${c.reductionPct}%`, color: "text-blue" },
            { label: "Previous contract", value: `$${c.contractValue.toLocaleString()}`, color: "text-navy" },
          ].map((s, i) => (
            <div key={s.label} className={`p-5 md:p-6 text-center ${i > 0 ? "sm:border-l border-t sm:border-t-0 border-gray-200" : ""}`}>
              <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{s.label}</div>
              <div className={`font-serif text-2xl md:text-3xl ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Body */}
      <section className="px-6 md:px-8 py-12 md:py-20 bg-off-white">
        <div className="max-w-3xl mx-auto flex flex-col gap-10">

          {/* Problem */}
          <div>
            <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-red mb-3">The problem</div>
            <p className="font-sans text-base text-gray-700 leading-relaxed">{c.problem}</p>
          </div>

          {/* Approach */}
          <div>
            <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-3">Our approach</div>
            <p className="font-sans text-base text-gray-700 leading-relaxed">{c.approach}</p>
          </div>

          {/* What we flagged */}
          <div>
            <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-amber mb-3">What we flagged</div>
            <div className="flex flex-col gap-3">
              {c.flaggedItems.map((f, i) => (
                <div key={i} className="bg-white border-l-4 border-l-red border border-gray-200 rounded-xl p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <div className="font-serif text-navy text-lg leading-tight mb-1">{f.item}</div>
                      <div className="font-sans text-sm text-gray-500 leading-relaxed">{f.issue}</div>
                    </div>
                    <div className="bg-teal-light border border-teal/30 rounded-lg px-3 py-1.5 self-start whitespace-nowrap">
                      <span className="font-sans text-[10px] uppercase tracking-wider text-teal">Saved</span>
                      <span className="font-serif text-teal ml-2 text-base">${f.savings.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal mb-3">The outcome</div>
            <p className="font-sans text-base text-gray-700 leading-relaxed">{c.outcome}</p>
          </div>

          {/* Quote */}
          <div className="bg-white border-l-4 border-l-blue border border-gray-200 rounded-xl p-6 md:p-8">
            <p className="font-serif italic text-navy text-lg md:text-xl leading-relaxed mb-4">
              "{c.quote}"
            </p>
            <div className="font-sans text-sm text-gray-500">
              — {c.quoteAttribution}, <span className="text-navy font-medium">{c.business}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-8 py-20 md:py-28 bg-gradient-to-br from-navy to-navy-dark text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(28px,4vw,44px)" }}>
            See what's in <em className="italic text-blue-light">your</em> contract.
          </h2>
          <p className="font-sans font-light text-white/70 leading-relaxed mb-8">
            Upload one invoice — your first recommendation is free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/invoice" className="font-sans text-sm font-medium bg-teal text-white px-6 py-3 rounded-lg no-underline hover:opacity-90 transition-opacity">
              Upload an invoice
            </Link>
            <Link href="/customers" className="font-sans text-sm font-medium bg-white/10 border border-white/20 text-white px-6 py-3 rounded-lg no-underline hover:bg-white/20 transition-colors">
              Read more stories
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

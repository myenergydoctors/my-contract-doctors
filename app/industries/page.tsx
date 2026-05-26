import Link from "next/link";
import { industries } from "@/lib/industries";

export const metadata = { title: "Industries we serve | My Contract Doctors" };

export default function IndustriesPage() {
  const list = Object.values(industries);
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark to-navy px-6 md:px-8 pt-28 md:pt-36 pb-16 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-teal block mb-4">Industries</span>
          <h1 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(32px,4.5vw,52px)" }}>
            Built for the industries with the <em className="italic text-blue-light">biggest negotiation opportunities.</em>
          </h1>
          <p className="font-sans font-light text-white/70 leading-relaxed text-base md:text-lg">
            Different industries see different clauses in the same service contracts. Pick yours to see what we typically help with.
          </p>
        </div>
      </section>

      {/* Industry cards */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-off-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {list.map(ind => (
            <Link key={ind.slug} href={`/industries/${ind.slug}`} className="block bg-white border border-gray-200 rounded-2xl p-6 md:p-7 hover:border-blue hover:shadow-lg transition-all no-underline">
              <h2 className="font-serif text-navy text-xl leading-tight mb-2">{ind.name}</h2>
              <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">{ind.intro}</p>
              <div className="flex flex-col gap-1 mb-5">
                <div className="flex justify-between font-sans text-xs">
                  <span className="text-gray-500">Typical monthly spend</span>
                  <span className="text-navy font-medium">{ind.avgSpend}</span>
                </div>
                <div className="flex justify-between font-sans text-xs">
                  <span className="text-gray-500">Typical annual savings</span>
                  <span className="text-teal font-medium">{ind.avgSavings}</span>
                </div>
              </div>
              <span className="font-sans text-sm font-medium text-blue">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-8 py-20 md:py-28 bg-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-navy leading-tight mb-5" style={{ fontSize: "clamp(28px,4vw,44px)" }}>
            Don't see your industry?
          </h2>
          <p className="font-sans font-light text-gray-500 leading-relaxed mb-8">
            We work across every industry that buys recurring services. Reach out and we'll tell you exactly what we'd find in your contracts.
          </p>
          <Link href="/contact" className="inline-block font-sans text-sm font-medium bg-navy text-white px-6 py-3 rounded-lg no-underline hover:opacity-90 transition-opacity">
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}

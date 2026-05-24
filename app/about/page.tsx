import Link from "next/link";

export const metadata = { title: "About | My Contract Doctors" };

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark to-navy px-6 md:px-8 pt-28 md:pt-36 pb-16 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-teal block mb-4">About</span>
          <h1 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(32px,4.5vw,52px)" }}>
            We're on your side.<br />
            <em className="italic text-blue-light">Not the vendor's.</em>
          </h1>
          <p className="font-sans font-light text-white/70 leading-relaxed text-base md:text-lg">
            Every uniform and linen agreement we've reviewed had at least one clause designed to drain the customer. We're the team putting those numbers back where they belong — in your pocket.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-off-white">
        <div className="max-w-3xl mx-auto">
          <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Why we exist</span>
          <h2 className="font-serif text-navy leading-tight mb-6" style={{ fontSize: "clamp(28px,4vw,40px)" }}>
            The recurring expenses no one audits.
          </h2>
          <div className="font-sans font-light text-gray-700 text-base leading-relaxed flex flex-col gap-4">
            <p>
              Walk into any small business — a restaurant, a body shop, a hospital, a manufacturing plant — and you'll find a stack of recurring service invoices nobody reads carefully. Uniforms. Linens. Floor mats. Energy. Telecom. Waste hauling. Merchant fees.
            </p>
            <p>
              The vendors who write those contracts have spent decades perfecting how to embed auto-renewals, minimum billing floors, vague service charges, and pricing escalators that compound year after year. Most businesses sign the agreement, file it away, and never look at it again.
            </p>
            <p>
              That's billions of dollars a year that quietly leave small businesses without anyone ever questioning it.
            </p>
            <p className="font-serif text-navy text-lg leading-snug italic pt-2 border-l-2 border-blue pl-4">
              We started My Contract Doctors because we believe every business owner deserves to understand what they're signing, what they're paying, and where they're being overcharged — without needing a law degree or a procurement team.
            </p>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Our approach</span>
            <h2 className="font-serif text-navy leading-tight" style={{ fontSize: "clamp(28px,4vw,40px)" }}>Audit, explain, negotiate.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Audit with AI",
                body: "We analyze every line of your invoice and every clause of your contract against a database of thousands of agreements in your region. We know what 'normal' looks like — so we know exactly where you're off.",
              },
              {
                num: "02",
                title: "Explain in plain English",
                body: "No legal jargon. Every flagged item comes with a clear explanation of the problem, why it matters, and exactly how much it's costing you per year.",
              },
              {
                num: "03",
                title: "Hand you the script",
                body: "We draft the dispute letter or negotiation email for you. You hit send, the vendor takes you seriously, and the credit shows up on your next invoice.",
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="bg-off-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-2 right-4 font-serif italic text-blue/10 text-6xl leading-none select-none">{num}</div>
                <div className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-teal mb-3 relative">Step {num}</div>
                <h3 className="font-serif text-navy text-xl leading-tight mb-3 relative">{title}</h3>
                <p className="font-sans font-light text-gray-500 text-sm leading-relaxed relative">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Numbers */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-gradient-to-br from-navy to-navy-dark text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue-light block mb-3">By the numbers</span>
            <h2 className="font-serif leading-tight" style={{ fontSize: "clamp(28px,4vw,40px)" }}>What we've found so far.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { stat: "1,247", label: "Contracts analyzed" },
              { stat: "$4.3M", label: "Identified in savings" },
              { stat: "$3,437", label: "Average per contract" },
              { stat: "78%", label: "Have auto-renewal traps" },
            ].map(({ stat, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="font-serif text-blue-light text-3xl md:text-4xl mb-2">{stat}</div>
                <div className="font-sans text-sm text-white/65 leading-snug">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sister companies */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-off-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Part of a family</span>
            <h2 className="font-serif text-navy leading-tight mb-3" style={{ fontSize: "clamp(28px,4vw,40px)" }}>Doing the same for every expense.</h2>
            <p className="font-sans font-light text-gray-500 leading-relaxed max-w-2xl mx-auto">
              My Contract Doctors is one of a family of businesses helping small companies take control of recurring costs they don't have time to audit themselves.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "My Energy Doctors", url: "https://myenergydoctors.com", body: "Audit electricity and natural gas bills, find rate misalignments, benchmark against competitive suppliers.", accent: "from-amber-500 to-red" },
              { name: "360 Fuel Card", url: "https://360fuelcard.com", body: "Fleet fuel cards with nationwide discounts, online tracking, and security controls. Backed by 60+ years of fuel-industry experience.", accent: "from-amber-600 to-amber-800" },
              { name: "OSC Web Design", url: "https://oscwebdesign.biz", body: "Web design, app design, digital marketing, analytics, and social — for retail, wholesale, B2B, and service businesses.", accent: "from-blue-light to-navy" },
            ].map(({ name, url, body, accent }) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="block bg-white border border-gray-200 rounded-2xl overflow-hidden no-underline hover:border-blue hover:shadow-lg transition-all">
                <div className={`h-2 bg-gradient-to-r ${accent}`} />
                <div className="p-6">
                  <h3 className="font-serif text-navy text-lg mb-2">{name}</h3>
                  <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-4">{body}</p>
                  <span className="font-sans text-sm font-medium text-blue">Visit →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-8 py-20 md:py-28 bg-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-navy leading-tight mb-5" style={{ fontSize: "clamp(28px,4vw,44px)" }}>
            Ready to see what we'd find?
          </h2>
          <p className="font-sans font-light text-gray-500 leading-relaxed mb-8">
            Upload one invoice and we'll show you exactly where you're overpaying. First recommendation is free, no card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/invoice" className="font-sans text-sm font-medium bg-teal text-white px-6 py-3 rounded-lg no-underline hover:opacity-90 transition-opacity">
              Upload an invoice — free
            </Link>
            <Link href="/contact" className="font-sans text-sm font-medium bg-white border border-gray-300 text-navy px-6 py-3 rounded-lg no-underline hover:bg-off-white transition-colors">
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

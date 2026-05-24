"use client";
import Link from "next/link";
import { useState } from "react";

export default function FreeGuidePage() {
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock — replace with real email capture API in Phase 2
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark to-navy px-6 md:px-8 pt-28 md:pt-36 pb-16 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: copy */}
          <div>
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-teal block mb-4">Free guide · No card required</span>
            <h1 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(30px,4.5vw,46px)" }}>
              7 clauses that are costing you <em className="italic text-blue-light">thousands</em> right now.
            </h1>
            <p className="font-sans font-light text-white/70 leading-relaxed text-base mb-6">
              A field-tested PDF guide for small business owners. We break down the seven most common predatory clauses in uniform and linen service agreements — with the exact language to look for and how to negotiate each one out.
            </p>
            <ul className="flex flex-col gap-2.5 mb-2">
              {[
                "How to spot auto-renewal traps before you sign",
                "The pricing escalator trick costing you 4–6% a year",
                "Why 'minimum weekly billing' should be your top negotiation target",
                "The vendor-priced 'replacement cost' game (and how to cap it)",
                "Sample dispute letter language you can use today",
              ].map(b => (
                <li key={b} className="flex gap-2 items-start font-sans text-sm text-white/85">
                  <span className="text-teal flex-shrink-0">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: form */}
          <div>
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
              {!submitted ? (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-teal-light text-teal flex items-center justify-center text-xl">▤</div>
                    <div>
                      <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal">Instant download</div>
                      <div className="font-serif text-navy text-lg">7 Clauses · PDF</div>
                    </div>
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div>
                      <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Work email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@yourbusiness.com"
                        required
                        className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block font-sans text-xs font-semibold text-gray-700 mb-1.5">Business name</label>
                      <input
                        type="text"
                        value={business}
                        onChange={e => setBusiness(e.target.value)}
                        placeholder="Acme Restaurant Group"
                        required
                        className="w-full font-sans text-sm text-navy rounded-lg px-3.5 py-3 border-[1.5px] border-gray-300 outline-none focus:border-blue transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="font-sans text-sm font-medium bg-teal text-white py-3.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 mt-1"
                    >
                      {loading ? "Sending…" : "Send me the PDF →"}
                    </button>
                    <p className="font-sans text-[11px] text-gray-500 text-center mt-2">
                      We'll never spam you. Unsubscribe with one click.
                    </p>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-teal-light text-teal flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                  <h3 className="font-serif text-navy text-xl mb-2">Check your inbox</h3>
                  <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-5">
                    We just sent the guide to <strong className="text-navy">{email}</strong>. If you don't see it in 2 minutes, check your spam folder.
                  </p>
                  <Link href="/invoice" className="inline-block font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg no-underline hover:opacity-90 transition-opacity">
                    Try our free invoice analyzer →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="px-6 md:px-8 py-10 md:py-14 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500 mb-5">Trusted by businesses across the country</div>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 font-serif text-gray-400 text-xl md:text-2xl">
            <span>Restaurants</span>
            <span>Healthcare</span>
            <span>Manufacturing</span>
            <span>Retail</span>
            <span>Automotive</span>
          </div>
        </div>
      </section>

      {/* Preview snippet */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-off-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Preview</span>
            <h2 className="font-serif text-navy leading-tight" style={{ fontSize: "clamp(26px,3.5vw,38px)" }}>One example from the guide</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
            <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-red mb-3">Clause #3 — Minimum Weekly Billing</div>
            <p className="font-sans text-navy text-base leading-relaxed mb-4 font-light italic border-l-2 border-l-gray-300 pl-4">
              "Customer agrees to maintain a minimum weekly service charge of $X, regardless of actual quantity of items rented or services rendered."
            </p>
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal mb-2">Why it matters</div>
            <p className="font-sans text-gray-700 text-sm leading-relaxed mb-4">
              This locks you into paying the same amount even if you reduce service, close a location for a holiday, or your business slows seasonally. There's no flex. Most contracts let this number escalate annually too.
            </p>
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-blue mb-2">What to ask for</div>
            <p className="font-sans text-gray-700 text-sm leading-relaxed">
              Push for an under-utilization reconciliation clause — meaning if you don't actually use the minimum, you don't pay for it. Or ask for the minimum to drop after year 1.
            </p>
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="font-sans text-sm text-gray-500">Get all 7 — plus sample dispute letter language — in the full PDF.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

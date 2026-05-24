"use client";
import Link from "next/link";
import { useState } from "react";

type Article = { id: string; q: string; a: string };
type Category = { id: string; title: string; description: string; icon: string; articles: Article[] };

const categories: Category[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "Your first analysis, what to expect, and how the platform works.",
    icon: "▦",
    articles: [
      { id: "first-upload", q: "How do I upload my first invoice?", a: "Head to the Invoice page or click 'Upload invoice' from your dashboard. You can drag-and-drop a PDF or image, or use the QR code option to photograph a paper invoice from your phone. Most uploads finish processing within 60 seconds." },
      { id: "what-we-find", q: "What kinds of overcharges do you find?", a: "We catch above-cap escalators, unauthorized surcharges (fuel, environmental, energy), minimum billing applied incorrectly, vendor-priced replacement charges, missing volume tiers, and contract violations like exclusivity issues. Every flagged item comes with the exact contract clause and recommended next step." },
      { id: "free-vs-pro", q: "What's the difference between the Free and Pro plans?", a: "Free gets you one recommendation per invoice — useful to see what we'd find. Pro unlocks every flagged item, contract analyses, the Industry Insights dashboard, auto-renewal alerts, and quarterly automatic reviews. See /pricing for the full comparison." },
    ],
  },
  {
    id: "invoices",
    title: "Invoice analysis",
    description: "How the invoice audit works and what to do with the results.",
    icon: "▤",
    articles: [
      { id: "supported-formats", q: "What file formats can I upload?", a: "PDF is best (clearest line-item extraction). We also accept JPG, PNG, and HEIC. If you only have a paper invoice, use the QR code option to photograph it from your phone — the result will be just as accurate." },
      { id: "vendors", q: "Which vendors do you support?", a: "All major uniform and linen service providers — Cintas, UniFirst, ALSCO, ImageFirst, Aramark, G&K Services, and most regional providers. The contract patterns are similar across all of them, so we can analyze any service invoice." },
      { id: "dispute-letter", q: "How do dispute letters work?", a: "For every flagged item we identify, we draft the exact dispute correspondence to send your vendor. You review, customize if needed, and send. Vendors take written disputes seriously — in our experience over 80% of disputes result in a credit." },
    ],
  },
  {
    id: "contracts",
    title: "Contract analysis",
    description: "Understanding the Agreement product and what's in a full contract audit.",
    icon: "▥",
    articles: [
      { id: "what-is-agreement", q: "What's included in the Agreement analysis?", a: "Full clause-by-clause breakdown, risk score, the 3–5 highest-priority actions, vendor benchmarking, and pre-drafted negotiation emails for each issue. You keep lifetime access to the analysis." },
      { id: "demystifier-vs-agreement", q: "Demystifier vs Agreement — which do I need?", a: "Demystifier ($49.99 one-time) is a walkthrough of a real sample contract — best if you want to learn what to look for before signing or negotiating. Agreement ($49 one-time) is a personalized analysis of YOUR specific contract. Most customers get the Demystifier first, then upload their own contract for an Agreement analysis later." },
      { id: "renewal-window", q: "How do auto-renewal alerts work?", a: "When you upload a contract, we extract the renewal date and notice window. We then send you an email 120 days before the auto-renewal cutoff so you have time to send written notice if you want to renegotiate or switch vendors. Pro plan only." },
    ],
  },
  {
    id: "billing",
    title: "Billing & account",
    description: "Plans, payments, and account management.",
    icon: "◉",
    articles: [
      { id: "cancel", q: "How do I cancel my Pro plan?", a: "Go to /dashboard/billing and click 'Cancel plan.' You retain access through the end of your billing period. We don't lock you into annual contracts." },
      { id: "team-pricing", q: "Do you offer team or multi-location pricing?", a: "Yes. If you manage multiple locations, franchises, or facilities, contact us and we'll quote volume pricing. We work with everything from single restaurants to multi-state hospital systems." },
      { id: "refund", q: "Do you offer refunds?", a: "If you're not satisfied with your first analysis on the Agreement or Demystifier products, contact us within 30 days and we'll refund you. For Pro subscriptions, refunds within the first billing cycle." },
    ],
  },
  {
    id: "data",
    title: "Data & privacy",
    description: "How we handle your contracts and invoices.",
    icon: "◑",
    articles: [
      { id: "data-storage", q: "Where is my contract data stored?", a: "Encrypted at rest, US-based servers, never shared with vendors. Your data is used only to generate your analysis and (anonymized) to improve our industry benchmarks." },
      { id: "vendor-disclosure", q: "Do vendors know you analyzed our contract?", a: "Only if you tell them. The dispute letters and negotiation emails we draft don't mention our company — they're written as if you sent them yourself." },
      { id: "delete-data", q: "Can I delete my data?", a: "Yes. Settings → Delete account permanently removes your contracts, invoices, and analyses. The deletion is irreversible." },
    ],
  },
  {
    id: "vendors-disputes",
    title: "Vendor disputes",
    description: "What to expect when you push back on overcharges.",
    icon: "◬",
    articles: [
      { id: "retaliation", q: "Will the vendor retaliate if we dispute?", a: "In our experience, no. Vendors take written disputes seriously because the alternative is losing the account. We've never seen a dispute lead to service changes or quality issues." },
      { id: "dispute-outcome", q: "How long does a typical dispute take?", a: "Most vendors respond within 2–4 weeks. Credits typically appear on the next billing cycle. Larger disputes (>$5K) can take longer and may go to the vendor's regional or national account manager." },
      { id: "negotiation-leverage", q: "What's our leverage in a negotiation?", a: "More than you think. Most contracts have annual renewal options buried in the auto-renewal clause, and most vendors are violating their own contracts in ways that give you leverage. We surface both for you." },
    ],
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? categories.map(c => ({
        ...c,
        articles: c.articles.filter(a => (a.q + " " + a.a).toLowerCase().includes(query.trim().toLowerCase())),
      })).filter(c => c.articles.length > 0)
    : categories;

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark to-navy px-6 md:px-8 pt-28 md:pt-36 pb-12 md:pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-teal block mb-4">Help center</span>
          <h1 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(32px,4.5vw,52px)" }}>
            How can we help?
          </h1>
          <p className="font-sans font-light text-white/70 leading-relaxed text-base md:text-lg mb-8">
            Quick answers to the questions most customers ask. Can't find what you need? Reach out directly.
          </p>
          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search the help center…"
              className="w-full font-sans text-base text-navy bg-white rounded-xl px-5 py-4 outline-none shadow-xl placeholder:text-gray-400"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 font-sans text-sm text-gray-400">⌕</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-off-white">
        <div className="max-w-5xl mx-auto">
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <h3 className="font-serif text-navy text-xl mb-2">No matching articles</h3>
              <p className="font-sans text-gray-500 mb-5">Try a different search term, or reach out directly.</p>
              <Link href="/contact" className="inline-block font-sans text-sm font-medium bg-navy text-white px-5 py-2.5 rounded-lg no-underline hover:opacity-90 transition-opacity">Contact us</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filtered.map(cat => (
                <section key={cat.id} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-blue-pale text-blue flex items-center justify-center text-xl flex-shrink-0">{cat.icon}</div>
                    <div>
                      <h2 className="font-serif text-navy text-xl mb-1">{cat.title}</h2>
                      <p className="font-sans text-sm text-gray-500">{cat.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {cat.articles.map(a => <Article key={a.id} {...a} />)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-navy leading-tight mb-5" style={{ fontSize: "clamp(26px,3.5vw,38px)" }}>Still have questions?</h2>
          <p className="font-sans font-light text-gray-500 leading-relaxed mb-8">
            Drop us a note and we'll respond within one business day. Or upload an invoice and see what we'd find.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="font-sans text-sm font-medium bg-navy text-white px-6 py-3 rounded-lg no-underline hover:opacity-90 transition-opacity">
              Contact us
            </Link>
            <Link href="/invoice" className="font-sans text-sm font-medium bg-white border border-gray-300 text-navy px-6 py-3 rounded-lg no-underline hover:bg-off-white transition-colors">
              Upload an invoice
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Article({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-b-0 border-gray-100">
      <button onClick={() => setOpen(o => !o)} className="w-full bg-transparent border-none py-4 flex justify-between items-center cursor-pointer gap-3 text-left">
        <span className="font-sans text-sm font-medium text-navy leading-snug">{q}</span>
        <span className="text-blue text-lg flex-shrink-0 leading-none transition-transform duration-200" style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
      </button>
      {open && <div className="font-sans font-light text-gray-500 text-sm leading-relaxed pb-4">{a}</div>}
    </div>
  );
}

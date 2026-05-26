import Link from "next/link";
import GuaranteeBadge from "@/components/GuaranteeBadge";

export const metadata = {
  title: "Compare your options",
  description: "How My Contract Doctors compares to reviewing your own contracts, hiring a consultant, or asking your procurement team to handle it.",
};

type Row = { feature: string; mcd: string; diy: string; consultant: string; procurement: string };

const rows: Row[] = [
  { feature: "Cost to start",                mcd: "$0 — free first analysis", diy: "$0 (your time)",                  consultant: "$2,500–$10,000+",                procurement: "Salary + overhead" },
  { feature: "Time to first finding",        mcd: "Under 2 minutes",          diy: "5–20 hours of reading",           consultant: "2–6 weeks",                       procurement: "Weeks, if it's a priority" },
  { feature: "Industry benchmark data",      mcd: "1,200+ contracts analyzed", diy: "None",                            consultant: "Limited to their network",        procurement: "Internal only" },
  { feature: "Dispute letter templates",     mcd: "Included, ready to send",  diy: "Write your own",                  consultant: "Sometimes included",              procurement: "Internal drafting" },
  { feature: "Auto-renewal alerts",          mcd: "90 days before renewal",   diy: "Calendar reminder + good luck",   consultant: "Engagement-dependent",            procurement: "Usually missed" },
  { feature: "Ongoing monitoring",           mcd: "Quarterly automatic",      diy: "If you remember",                 consultant: "Per engagement",                  procurement: "If they have capacity" },
  { feature: "Risk of vendor escalation",    mcd: "Low — letters look like you wrote them", diy: "Low",                                consultant: "Higher — vendor knows it's a consultant", procurement: "Varies" },
  { feature: "Best for",                     mcd: "Small + mid-market businesses",         diy: "Solo operators with time + legal background", consultant: "Enterprise with budget",         procurement: "Large orgs with established teams" },
];

const tradeoffs = [
  {
    title: "Doing it yourself",
    icon: "📄",
    accent: "from-gray-500 to-navy",
    body: "Reading a 30-page service agreement takes 5–20 hours, plus more time to research market rates. If you have legal background and the time, it works. Most operators don't.",
    bestFor: "Solo operators with legal background and a free weekend.",
  },
  {
    title: "Hiring a consultant",
    icon: "👔",
    accent: "from-amber-500 to-red",
    body: "Specialized contract consultants exist, typically charging $2,500–$10,000 per engagement. Their depth is excellent on a single contract; less so on ongoing monitoring or quick invoice audits.",
    bestFor: "Enterprises with a procurement budget and one big contract on the line.",
  },
  {
    title: "Your procurement team",
    icon: "🏛",
    accent: "from-blue to-blue-mid",
    body: "If you have a dedicated procurement team, they can handle this — but service contracts (uniforms, linens, waste, fuel) often slip down the priority list behind larger spend categories.",
    bestFor: "Large organizations with established procurement functions.",
  },
  {
    title: "My Contract Doctors",
    icon: "✓",
    accent: "from-teal to-blue",
    body: "Designed for small and mid-market businesses that don't have a procurement team and can't justify a consultant. Fast, low-cost, ongoing — and gives you the language to negotiate yourself.",
    bestFor: "Restaurants, healthcare, manufacturing, retail, and service businesses 1–500 locations.",
    primary: true,
  },
];

export default function ComparePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark to-navy px-6 md:px-8 pt-28 md:pt-36 pb-16 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-teal block mb-4">How we compare</span>
          <h1 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(32px,4.5vw,52px)" }}>
            Four ways to review your contracts.<br />
            <em className="italic text-blue-light">Here's how they stack up.</em>
          </h1>
          <p className="font-sans font-light text-white/70 leading-relaxed text-base md:text-lg">
            DIY, a consultant, your procurement team, or My Contract Doctors. Pick the path that fits your business — we'll show you what each looks like.
          </p>
        </div>
      </section>

      {/* Tradeoff cards */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-off-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {tradeoffs.map(t => (
            <div key={t.title} className={`bg-white border rounded-2xl p-6 md:p-7 flex flex-col ${t.primary ? "border-2 border-teal shadow-lg" : "border-gray-200"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.accent} flex items-center justify-center text-white text-lg flex-shrink-0`}>{t.icon}</div>
                <h2 className="font-serif text-navy text-xl leading-tight">{t.title}</h2>
              </div>
              <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-4 flex-1">{t.body}</p>
              <div className="font-sans text-xs text-navy bg-off-white border border-gray-200 rounded-lg p-3">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-gray-500 mr-2">Best for:</span>
                {t.bestFor}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detail table */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-blue block mb-3">Side by side</span>
            <h2 className="font-serif text-navy leading-tight" style={{ fontSize: "clamp(26px,3.5vw,38px)" }}>The detail comparison</h2>
          </div>
          <div className="bg-off-white border border-gray-200 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="text-left px-5 py-4 font-sans text-xs font-semibold uppercase tracking-wider text-white/70">Feature</th>
                  <th className="text-center px-5 py-4 font-sans text-sm bg-teal/20">MCD</th>
                  <th className="text-center px-5 py-4 font-sans text-sm text-white/70">DIY</th>
                  <th className="text-center px-5 py-4 font-sans text-sm text-white/70">Consultant</th>
                  <th className="text-center px-5 py-4 font-sans text-sm text-white/70">Procurement team</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.feature} className={`border-t border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-off-white"}`}>
                    <td className="px-5 py-3 font-sans text-sm text-navy font-medium">{row.feature}</td>
                    <td className="px-5 py-3 text-center font-sans text-sm text-navy bg-teal/5">{row.mcd}</td>
                    <td className="px-5 py-3 text-center font-sans text-sm text-gray-500">{row.diy}</td>
                    <td className="px-5 py-3 text-center font-sans text-sm text-gray-500">{row.consultant}</td>
                    <td className="px-5 py-3 text-center font-sans text-sm text-gray-500">{row.procurement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Honest note */}
      <section className="px-6 md:px-8 py-12 md:py-16 bg-off-white">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
          <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-2">An honest take</div>
          <h3 className="font-serif text-navy text-xl md:text-2xl leading-tight mb-3">When MCD isn't the right fit.</h3>
          <p className="font-sans font-light text-gray-500 leading-relaxed text-sm md:text-base">
            If you're running a Fortune 500 with deep procurement infrastructure, a dedicated category-management team, and existing benchmarking data — you probably don't need us. Our sweet spot is small and mid-market businesses (1–500 locations) where contracts get signed, filed, and rarely re-read. If that's you, we're built for you.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-8 py-20 md:py-28 bg-gradient-to-br from-navy to-navy-dark text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(28px,4vw,44px)" }}>
            Try us. <em className="italic text-blue-light">Free.</em>
          </h2>
          <p className="font-sans font-light text-white/70 leading-relaxed mb-6">
            Upload one invoice and see exactly what we'd flag. No credit card, no commitment, no time wasted.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link href="/invoice" className="font-sans text-sm font-medium bg-teal text-white px-6 py-3 rounded-lg no-underline hover:opacity-90 transition-opacity">
              Upload an invoice — free
            </Link>
            <Link href="/pricing" className="font-sans text-sm font-medium bg-white/10 border border-white/20 text-white px-6 py-3 rounded-lg no-underline hover:bg-white/20 transition-colors">
              See pricing
            </Link>
          </div>
          <div className="flex justify-center">
            <GuaranteeBadge variant="dark-bg" />
          </div>
        </div>
      </section>
    </>
  );
}

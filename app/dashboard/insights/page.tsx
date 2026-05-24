import Link from "next/link";
import { mockInsights, mockUser } from "@/lib/mock-data";

export default function InsightsPage() {
  const locked = mockUser.plan !== "pro";

  return (
    <div className="max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal mb-2">Industry Insights</div>
        <h2 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-2">
          What we're seeing across {mockInsights.totalAnalyzedContracts.toLocaleString()} contracts.
        </h2>
        <p className="font-sans font-light text-gray-500 leading-relaxed max-w-3xl">
          Aggregated data from every customer analysis. Use it to benchmark your vendor, spot industry-wide patterns, and arm yourself with leverage in your next negotiation.
        </p>
      </div>

      {/* Lock overlay wrapper */}
      <div className="relative">
        {locked && (
          <div className="absolute inset-0 z-20 backdrop-blur-sm bg-white/40 rounded-2xl flex items-center justify-center">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md mx-4 text-center shadow-xl">
              <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal mb-3">Pro plan required</div>
              <h3 className="font-serif text-navy text-2xl leading-tight mb-3">Unlock Industry Insights</h3>
              <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-5">
                Industry Insights is included with the Pro plan. See exactly how your contracts compare to thousands of others — and where the biggest negotiation wins are hiding.
              </p>
              <Link href="/dashboard/billing" className="inline-block font-sans text-sm font-medium bg-teal text-white px-5 py-3 rounded-lg no-underline hover:opacity-90 transition-opacity">
                Upgrade to Pro
              </Link>
            </div>
          </div>
        )}

        {/* Headline stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <BigStat label="Contracts analyzed" value={mockInsights.totalAnalyzedContracts.toLocaleString()} />
          <BigStat label="Total savings identified" value={`$${(mockInsights.totalIdentifiedSavings / 1_000_000).toFixed(2)}M`} accent />
          <BigStat label="Average per contract" value={`$${mockInsights.averageSavingsPerContract.toLocaleString()}`} />
        </div>

        {/* Vendor comparison */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h3 className="font-serif text-navy text-xl mb-1">Vendor overcharge benchmarks</h3>
          <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-5">
            Average percentage above market rate by vendor, across all customer analyses.
          </p>
          <div className="flex flex-col gap-3">
            {mockInsights.topVendors.map(v => (
              <div key={v.name} className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center">
                <div className="font-sans text-sm font-medium text-navy">{v.name}</div>
                <div className="h-7 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(v.avgOverpaymentPct / 40) * 100}%`,
                      background: `linear-gradient(90deg, #3D80C8, #DC2626)`,
                    }}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-xs font-medium text-white">{v.contractsAnalyzed} analyzed</span>
                </div>
                <div className="font-serif text-red text-lg w-16 text-right">{v.avgOverpaymentPct}%</div>
              </div>
            ))}
          </div>
        </section>

        {/* Common clauses */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-serif text-navy text-xl mb-1">Most common predatory clauses</h3>
          <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-5">
            How often each problematic clause shows up in standard uniform/linen service agreements.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mockInsights.mostCommonClauses.map(c => (
              <div key={c.clause} className="bg-off-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="font-sans text-sm font-medium text-navy leading-snug">{c.clause}</span>
                  <span className="font-serif text-navy text-lg">{c.frequency}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red rounded-full" style={{ width: `${c.frequency}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function BigStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`border rounded-2xl p-6 ${accent ? "bg-gradient-to-br from-navy to-navy-dark text-white border-navy" : "bg-white border-gray-200"}`}>
      <div className={`font-sans text-[10px] font-semibold tracking-[0.14em] uppercase mb-3 ${accent ? "text-blue-light" : "text-gray-500"}`}>{label}</div>
      <div className={`font-serif text-3xl ${accent ? "text-white" : "text-navy"}`}>{value}</div>
    </div>
  );
}

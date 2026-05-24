import Link from "next/link";
import { mockUser, mockInvoices, mockAgreements } from "@/lib/mock-data";

export default function DashboardHome() {
  const totalSavingsIdentified =
    mockInvoices.reduce((sum, i) => sum + i.potentialAnnualSavings, 0) +
    mockAgreements.reduce((sum, a) => sum + a.topActions.reduce((s, x) => s + x.impact, 0), 0);

  const recentInvoices = mockInvoices.slice(0, 3);
  const recentAgreements = mockAgreements.slice(0, 2);

  return (
    <div className="max-w-6xl">

      {/* Welcome */}
      <div className="mb-8">
        <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal mb-2">Welcome back</div>
        <h2 className="font-serif text-navy text-3xl md:text-[34px] leading-tight mb-2">
          Good to see you, {mockUser.name.split(" ")[0]}.
        </h2>
        <p className="font-sans font-light text-gray-500 leading-relaxed">
          Here's what's been happening with your contracts and invoices at <span className="text-navy font-medium">{mockUser.businessName}</span>.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          eyebrow="Identified savings"
          value={`$${totalSavingsIdentified.toLocaleString()}`}
          sub="across all contracts and invoices"
          accent="teal"
        />
        <StatCard
          eyebrow="Invoices analyzed"
          value={mockInvoices.length.toString()}
          sub={`Most recent: ${new Date(mockInvoices[0].uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          accent="blue"
        />
        <StatCard
          eyebrow="Agreements scored"
          value={mockAgreements.length.toString()}
          sub="Average risk score: 78/100"
          accent="amber"
        />
        <StatCard
          eyebrow="Actions outstanding"
          value="3"
          sub="2 high priority, 1 medium"
          accent="red"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent invoices */}
        <section className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-serif text-navy text-xl">Recent invoice analyses</h3>
            <Link href="/dashboard/invoices" className="font-sans text-sm text-blue hover:text-navy no-underline">View all →</Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentInvoices.map(inv => (
              <Link
                key={inv.id}
                href={`/dashboard/invoices/${inv.id}`}
                className="block border border-gray-200 rounded-xl p-4 hover:border-blue hover:bg-blue-pale/30 transition-colors no-underline"
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div>
                    <div className="font-sans text-xs text-gray-500 mb-1">{inv.vendor} · {inv.invoiceNumber}</div>
                    <div className="font-sans text-sm font-medium text-navy">
                      {new Date(inv.uploadedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-sans text-xs text-gray-500">Potential savings</div>
                    <div className="font-serif text-teal text-lg">${inv.potentialAnnualSavings.toLocaleString()}/yr</div>
                  </div>
                </div>
                <div className="font-sans text-xs text-gray-500 leading-relaxed">{inv.topFinding}</div>
                <div className="flex gap-2 mt-3">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-red-light text-red px-2 py-1 rounded">
                    {inv.flaggedItemCount} flagged
                  </span>
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded">
                    ${inv.totalSpend}/mo
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Agreements + quick actions */}
        <div className="flex flex-col gap-6">

          {/* Agreements */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-serif text-navy text-xl">Agreements</h3>
              <Link href="/dashboard/agreements" className="font-sans text-sm text-blue hover:text-navy no-underline">View all →</Link>
            </div>
            <div className="flex flex-col gap-3">
              {recentAgreements.map(agr => (
                <Link
                  key={agr.id}
                  href={`/dashboard/agreements/${agr.id}`}
                  className="block border border-gray-200 rounded-xl p-4 hover:border-blue hover:bg-blue-pale/30 transition-colors no-underline"
                >
                  <div className="font-sans text-xs text-gray-500 mb-1">{agr.vendor}</div>
                  <div className="font-sans text-sm font-medium text-navy mb-3">{agr.agreementName}</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${agr.riskScore}%`,
                          background: agr.riskScore > 70 ? "#DC2626" : agr.riskScore > 40 ? "#D97706" : "#16A34A",
                        }}
                      />
                    </div>
                    <span className="font-serif text-navy text-sm">{agr.riskScore}/100</span>
                  </div>
                  <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-red mt-2">
                    {agr.riskScore > 70 ? "High risk" : agr.riskScore > 40 ? "Medium risk" : "Low risk"}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section className="bg-gradient-to-br from-navy to-navy-dark rounded-2xl p-6 text-white">
            <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue-light mb-3">Next step</div>
            <h3 className="font-serif text-xl mb-2 leading-tight">Upload your latest invoice</h3>
            <p className="font-sans font-light text-white/65 text-sm leading-relaxed mb-4">
              We'll compare it line-by-line against your last analysis and flag any new overcharges.
            </p>
            <Link
              href="/invoice"
              className="inline-block font-sans text-sm font-medium bg-teal text-white px-5 py-2.5 rounded-lg no-underline hover:opacity-90 transition-opacity"
            >
              Upload invoice →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ eyebrow, value, sub, accent }: { eyebrow: string; value: string; sub: string; accent: "teal" | "blue" | "amber" | "red" }) {
  const accentMap = {
    teal: "text-teal",
    blue: "text-blue",
    amber: "text-amber-600",
    red: "text-red",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-500 mb-2">{eyebrow}</div>
      <div className={`font-serif text-3xl mb-1 ${accentMap[accent]}`}>{value}</div>
      <div className="font-sans text-xs text-gray-500 leading-relaxed">{sub}</div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { mockUser } from "@/lib/mock-data";
import { useEffectiveData } from "@/lib/use-effective-plan";
import { useRealUser } from "@/lib/use-real-user";
import EmptyState from "@/components/portal/EmptyState";
import PaywallModal from "@/components/portal/PaywallModal";

export default function DashboardHome() {
  const { mode, plan, invoices, agreements } = useEffectiveData();
  const realUser = useRealUser();
  const empty = mode === "new";
  const [showAgreementPaywall, setShowAgreementPaywall] = useState(false);

  // Prefer real user metadata when available; fall back to mock for preview
  const firstName = realUser?.firstName || mockUser.name.split(" ")[0];
  const businessName = realUser?.business || mockUser.businessName;

  const handleAnalyzeAgreement = (e: React.MouseEvent) => {
    if (plan !== "pro") {
      e.preventDefault();
      setShowAgreementPaywall(true);
    }
  };

  const totalSavingsIdentified =
    invoices.reduce((sum, i) => sum + i.potentialAnnualSavings, 0) +
    agreements.reduce((sum, a) => sum + a.topActions.reduce((s, x) => s + x.impact, 0), 0);

  const recentInvoices = invoices.slice(0, 3);
  const recentAgreements = agreements.slice(0, 2);

  return (
    <div className="max-w-6xl">

      {/* Welcome */}
      <div className="mb-8">
        <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-teal mb-2">
          {empty ? "Welcome aboard" : "Welcome back"}
        </div>
        <h2 className="font-serif text-navy text-3xl md:text-[34px] leading-tight mb-2">
          {empty ? `Hi ${firstName}, let's get started.` : `Good to see you, ${firstName}.`}
        </h2>
        <p className="font-sans font-light text-gray-500 leading-relaxed">
          {empty
            ? <>Upload your first invoice and we'll show you where there's room to renegotiate at {businessName}.</>
            : <>Here's what's been happening with your contracts and invoices at <span className="text-navy font-medium">{businessName}</span>.</>}
        </p>
      </div>

      {/* Plan upgrade banner — shows for non-pro plans with some data */}
      {plan !== "pro" && !empty && (
        <div className="bg-gradient-to-br from-teal to-blue text-white rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-white/80 mb-1">
              {plan === "free" ? "You're on the free plan" : "Agreement plan only"}
            </div>
            <div className="font-serif text-lg leading-tight">
              {plan === "free"
                ? "Unlock the full report — and every invoice going forward."
                : "Get Pro for unlimited contracts, invoices, and Industry Insights."}
            </div>
          </div>
          <Link href="/checkout/pro" className="font-sans text-sm font-medium bg-white text-navy px-5 py-2.5 rounded-lg no-underline hover:opacity-90 transition-opacity whitespace-nowrap">
            Upgrade to Pro →
          </Link>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          eyebrow="Identified savings"
          value={`$${totalSavingsIdentified.toLocaleString()}`}
          sub={empty ? "Upload an invoice to get started" : "across all contracts and invoices"}
          accent="teal"
        />
        <StatCard
          eyebrow="Invoices analyzed"
          value={invoices.length.toString()}
          sub={empty ? "None yet" : `Most recent: ${new Date(invoices[0].uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          accent="blue"
        />
        <StatCard
          eyebrow="Agreements scored"
          value={agreements.length.toString()}
          sub={empty ? "None yet" : "Average risk score: 78/100"}
          accent="amber"
        />
        <StatCard
          eyebrow="Actions outstanding"
          value={empty ? "0" : "3"}
          sub={empty ? "Nothing to do yet" : "2 high priority, 1 medium"}
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
          {recentInvoices.length === 0 ? (
            <div className="py-6">
              <EmptyState
                illustration="upload"
                title="No invoices yet"
                body="Upload your first invoice to get a free recommendation. It takes about 60 seconds."
                primaryCta={{ label: "Upload an invoice →", href: "/invoice" }}
              />
            </div>
          ) : (
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
          )}
        </section>

        {/* Agreements + quick actions */}
        <div className="flex flex-col gap-6">

          {/* Agreements */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-serif text-navy text-xl">Agreements</h3>
              <Link href="/dashboard/agreements" className="font-sans text-sm text-blue hover:text-navy no-underline">View all →</Link>
            </div>
            {recentAgreements.length === 0 ? (
              <div className="text-center py-6">
                <div className="font-sans text-sm text-gray-500 mb-3 leading-relaxed">No agreements analyzed yet.</div>
                <Link href="/agreement" className="font-sans text-sm font-medium text-blue hover:text-navy no-underline">
                  Analyze your first →
                </Link>
              </div>
            ) : (
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
            )}
          </section>

          {/* Quick actions */}
          <section className="bg-gradient-to-br from-navy to-navy-dark rounded-2xl p-6 text-white">
            <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue-light mb-3">Quick actions</div>
            <h3 className="font-serif text-xl mb-2 leading-tight">Take the next step</h3>
            <p className="font-sans font-light text-white/65 text-sm leading-relaxed mb-4">
              Upload a new invoice, analyze your contract, or dig into how it all works.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/invoice"
                className="block font-sans text-sm font-medium bg-teal text-white px-5 py-2.5 rounded-lg no-underline hover:opacity-90 transition-opacity text-center"
              >
                Upload invoice →
              </Link>
              <Link
                href="/agreement"
                onClick={handleAnalyzeAgreement}
                className="block font-sans text-sm font-medium bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-lg no-underline hover:bg-white/20 transition-colors text-center"
              >
                Analyze an agreement →
              </Link>
              <Link
                href="/demystifier"
                className="block font-sans text-sm text-blue-light hover:text-white no-underline text-center pt-1"
              >
                Explore the Demystifier →
              </Link>
            </div>
          </section>
        </div>
      </div>

      <PaywallModal
        open={showAgreementPaywall}
        onClose={() => setShowAgreementPaywall(false)}
        reason={{ type: "agreement", currentPlan: plan }}
      />
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

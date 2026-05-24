import Link from "next/link";
import { mockAgreements } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import ClauseExplorer from "./ClauseExplorer";

export default async function AgreementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agreement = mockAgreements.find(a => a.id === id);
  if (!agreement) notFound();

  return (
    <div className="max-w-6xl">

      <Link href="/dashboard/agreements" className="inline-flex items-center font-sans text-sm text-blue hover:text-navy no-underline mb-4">
        ← Back to agreements
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="font-sans text-xs text-gray-500 mb-1">{agreement.vendor}</div>
        <h2 className="font-serif text-navy text-2xl md:text-3xl leading-tight mb-2">{agreement.agreementName}</h2>
        <p className="font-sans font-light text-gray-500 text-sm leading-relaxed max-w-3xl">
          {agreement.autoRenewal}
        </p>
      </div>

      {/* Score + facts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">

        {/* Risk score */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-3">Overall risk score</div>
          <div className="relative w-32 h-32 mb-3">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#E2E8F0" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={agreement.riskScore > 70 ? "#DC2626" : agreement.riskScore > 40 ? "#D97706" : "#16A34A"}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(agreement.riskScore / 100) * 326.7} 326.7`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-serif text-navy text-3xl">{agreement.riskScore}</div>
              <div className="font-sans text-[10px] uppercase tracking-wider text-gray-500">/ 100</div>
            </div>
          </div>
          <div className={`font-sans text-sm font-medium ${agreement.riskScore > 70 ? "text-red" : agreement.riskScore > 40 ? "text-amber-600" : "text-green-600"}`}>
            {agreement.riskScore > 70 ? "High risk" : agreement.riskScore > 40 ? "Medium risk" : "Low risk"}
          </div>
        </div>

        {/* Top actions */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal mb-3">Priority actions</div>
          <div className="flex flex-col gap-3">
            {agreement.topActions.map((a, i) => (
              <div key={i} className={`flex gap-3 items-start p-3 rounded-lg border ${i === 0 ? "bg-red-light border-red/20" : i === 1 ? "bg-amber-50 border-amber-200" : "bg-off-white border-gray-200"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-sans text-xs font-semibold text-white flex-shrink-0 ${i === 0 ? "bg-red" : i === 1 ? "bg-amber-600" : "bg-blue"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-sm font-medium text-navy mb-0.5">{a.title}</div>
                  <div className="font-sans text-xs text-gray-500 leading-relaxed">{a.body}</div>
                  {a.impact > 0 && (
                    <div className="font-serif text-teal text-sm mt-1">+ ${a.impact.toLocaleString()}/yr</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clause explorer */}
      <ClauseExplorer clauses={agreement.clauses} />
    </div>
  );
}

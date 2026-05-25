"use client";
import Link from "next/link";
import { useEffectiveData } from "@/lib/use-effective-plan";
import EmptyState from "@/components/portal/EmptyState";

export default function AgreementsListPage() {
  const { plan, agreements } = useEffectiveData();

  return (
    <div className="max-w-6xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <p className="font-sans font-light text-gray-500 leading-relaxed">
            Your uniform and linen service agreements, scored and broken down clause-by-clause.
          </p>
        </div>
        <Link
          href="/agreement"
          className="inline-flex items-center font-sans text-sm font-medium bg-teal text-white px-5 py-2.5 rounded-lg no-underline hover:opacity-90 transition-opacity self-start"
        >
          + Analyze new agreement
        </Link>
      </div>

      {agreements.length === 0 ? (
        <EmptyState
          illustration="contract"
          eyebrow="No agreements yet"
          title="Get a full breakdown of your contract."
          body="Upload your uniform or linen service agreement and we'll score it, flag every clause worth negotiating, and draft the emails you can send to fix them."
          primaryCta={{ label: "Analyze an agreement →", href: "/agreement" }}
          secondaryCta={{ label: "See a sample first", href: "/demystifier" }}
        />
      ) : (

      /* Agreements */
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {agreements.map(agr => (
          <Link
            key={agr.id}
            href={`/dashboard/agreements/${agr.id}`}
            className="block bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue hover:shadow-lg transition-all no-underline"
          >
            <div className="font-sans text-xs text-gray-500 mb-1">{agr.vendor}</div>
            <h3 className="font-serif text-navy text-lg leading-tight mb-4">{agr.agreementName}</h3>

            {/* Risk meter */}
            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500">Risk score</span>
                <span className="font-serif text-navy text-xl">{agr.riskScore}/100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${agr.riskScore}%`,
                    background: agr.riskScore > 70 ? "#DC2626" : agr.riskScore > 40 ? "#D97706" : "#16A34A",
                  }}
                />
              </div>
            </div>

            {/* Quick facts */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-off-white rounded-lg px-3 py-2">
                <div className="font-sans text-[10px] uppercase tracking-wider text-gray-500">Term</div>
                <div className="font-sans text-sm text-navy mt-0.5">{agr.termLength}</div>
              </div>
              <div className="bg-off-white rounded-lg px-3 py-2">
                <div className="font-sans text-[10px] uppercase tracking-wider text-gray-500">Clauses analyzed</div>
                <div className="font-sans text-sm text-navy mt-0.5">{agr.clauses.length}</div>
              </div>
            </div>

            {/* Top action */}
            <div className="bg-red-light border border-red/20 rounded-lg p-3">
              <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-red mb-1">Top priority</div>
              <div className="font-sans text-sm text-navy leading-snug">{agr.topActions[0].title}</div>
            </div>
          </Link>
        ))}
      </div>
      )}
    </div>
  );
}

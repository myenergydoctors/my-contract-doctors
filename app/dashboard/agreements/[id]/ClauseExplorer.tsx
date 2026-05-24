"use client";
import { useState } from "react";
import type { AgreementAnalysis } from "@/lib/mock-data";

export default function ClauseExplorer({ clauses }: { clauses: AgreementAnalysis["clauses"] }) {
  const [activeId, setActiveId] = useState(clauses[0]?.id);
  const active = clauses.find(c => c.id === activeId) || clauses[0];

  return (
    <section>
      <div className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-blue mb-3">
        Clause-by-clause breakdown
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 bg-white border border-gray-200 rounded-2xl overflow-hidden">

        {/* Clause list */}
        <div className="lg:border-r border-b lg:border-b-0 border-gray-200 overflow-y-auto max-h-none lg:max-h-[600px]">
          {clauses.map(c => {
            const isActive = c.id === activeId;
            const dotColor = c.risk === "high" ? "#DC2626" : c.risk === "medium" ? "#D97706" : "#16A34A";
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-4 py-3 border-b last:border-b-0 border-gray-100 cursor-pointer transition-colors ${isActive ? "bg-blue-pale border-l-[3px] border-l-blue" : "hover:bg-off-white border-l-[3px] border-l-transparent"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                  <span className={`font-sans text-sm leading-tight ${isActive ? "font-semibold text-navy" : "text-gray-700"}`}>{c.label}</span>
                </div>
                {c.annualImpact && c.annualImpact > 0 && (
                  <div className="font-sans text-xs text-red ml-4">−${c.annualImpact.toLocaleString()}/yr</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div className="p-6 overflow-y-auto max-h-none lg:max-h-[600px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-navy text-xl">{active.label}</h3>
            <RiskBadge risk={active.risk} />
          </div>

          <div className="mb-6">
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Your contract says</div>
            <div className="bg-off-white border-l-2 border-l-gray-300 rounded p-4 font-sans text-sm text-navy leading-relaxed italic">
              "{active.yourLanguage}"
            </div>
          </div>

          <div>
            <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal mb-2">Plain English</div>
            <div className="font-sans text-sm text-navy leading-relaxed">{active.plainEnglish}</div>
          </div>

          {active.annualImpact && active.annualImpact > 0 && (
            <div className="mt-6 bg-teal-light border border-teal/30 rounded-lg p-4 flex justify-between items-center gap-4">
              <div>
                <div className="font-sans text-[10px] font-semibold uppercase tracking-wider text-teal mb-1">Estimated annual cost</div>
                <div className="font-serif text-teal text-xl">${active.annualImpact.toLocaleString()}/yr</div>
              </div>
              <button className="font-sans text-sm font-medium bg-teal text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0">
                Draft negotiation email
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function RiskBadge({ risk }: { risk: "high" | "medium" | "low" }) {
  const m = {
    high: { bg: "bg-red-light", text: "text-red", label: "High risk" },
    medium: { bg: "bg-amber-50", text: "text-amber-600", label: "Medium risk" },
    low: { bg: "bg-green-50", text: "text-green-600", label: "Low risk" },
  }[risk];
  return (
    <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded ${m.bg} ${m.text}`}>
      {m.label}
    </span>
  );
}

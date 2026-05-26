"use client";
import Link from "next/link";
import { useState } from "react";
import GuaranteeBadge from "@/components/GuaranteeBadge";

type Plan = {
  id: string;
  name: string;
  description: string;
  features: string[];
  missing: string[];
  ctaHref: string;
  cta: string;
  highlighted?: boolean;
};

type PlansGridProps = {
  free: Plan;
  agreement: Plan;
  proMonthly: { price: string; cadence: string; ctaHref: string };
  proAnnual:  { price: string; cadence: string; effectiveMonthly: string; savings: string; ctaHref: string };
  proPlanBase: Plan;
};

export default function PlansGrid({ free, agreement, proMonthly, proAnnual, proPlanBase }: PlansGridProps) {
  const [annual, setAnnual] = useState(false);
  const proActive = annual ? proAnnual : proMonthly;

  return (
    <>
      {/* Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-white border border-gray-200 rounded-full p-1 inline-flex gap-1 shadow-sm">
          <button
            onClick={() => setAnnual(false)}
            className={`font-sans text-sm font-medium px-5 py-2 rounded-full transition-colors cursor-pointer ${!annual ? "bg-navy text-white" : "text-gray-500 hover:text-navy"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`font-sans text-sm font-medium px-5 py-2 rounded-full transition-colors cursor-pointer ${annual ? "bg-navy text-white" : "text-gray-500 hover:text-navy"} relative`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-teal text-white font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full leading-none">
              −10%
            </span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Free */}
        <PlanCard plan={free} priceBlock={<><span className="font-serif text-navy text-4xl">$0</span><span className="font-sans font-light text-gray-500 text-sm ml-2">forever</span></>} />

        {/* Agreement */}
        <PlanCard plan={agreement} priceBlock={<><span className="font-serif text-navy text-4xl">$49</span><span className="font-sans font-light text-gray-500 text-sm ml-2">one-time per agreement</span></>} />

        {/* Pro */}
        <PlanCard
          plan={{ ...proPlanBase, ctaHref: proActive.ctaHref }}
          priceBlock={
            annual ? (
              <>
                <span className="font-serif text-navy text-4xl">{proAnnual.effectiveMonthly}</span>
                <span className="font-sans font-light text-gray-500 text-sm ml-2">per month, billed yearly</span>
                <div className="font-sans text-xs text-teal mt-1">{proAnnual.savings}</div>
              </>
            ) : (
              <>
                <span className="font-serif text-navy text-4xl">{proMonthly.price}</span>
                <span className="font-sans font-light text-gray-500 text-sm ml-2">{proMonthly.cadence}</span>
              </>
            )
          }
        />
      </div>

      <div className="flex justify-center mt-8">
        <GuaranteeBadge />
      </div>
    </>
  );
}

function PlanCard({ plan, priceBlock }: { plan: Plan; priceBlock: React.ReactNode }) {
  return (
    <div
      className={`relative rounded-2xl p-6 md:p-8 flex flex-col bg-white ${plan.highlighted ? "border-2 border-teal shadow-xl md:scale-105" : "border border-gray-200"}`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal text-white font-sans text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
          Most popular
        </div>
      )}
      <h3 className="font-serif text-navy text-2xl mb-1">{plan.name}</h3>
      <div className="mb-3">{priceBlock}</div>
      <p className="font-sans font-light text-gray-500 text-sm leading-relaxed mb-6">{plan.description}</p>
      <ul className="flex flex-col gap-2.5 mb-6 flex-1">
        {plan.features.map(f => (
          <li key={f} className="flex gap-2 items-start font-sans text-sm text-navy">
            <span className={`text-base leading-tight flex-shrink-0 ${plan.highlighted ? "text-teal" : "text-blue"}`}>✓</span>
            <span>{f}</span>
          </li>
        ))}
        {plan.missing.map(f => (
          <li key={f} className="flex gap-2 items-start font-sans text-sm text-gray-400">
            <span className="text-base leading-tight flex-shrink-0">—</span>
            <span className="line-through">{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={plan.ctaHref}
        className={`font-sans text-sm font-medium px-5 py-3 rounded-lg no-underline text-center transition-opacity hover:opacity-90 ${
          plan.highlighted ? "bg-teal text-white" : "bg-navy text-white"
        }`}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

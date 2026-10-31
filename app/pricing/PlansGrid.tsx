"use client";
import Link from "next/link";
import brand from "@/components/marketing/BrandSections.module.css";
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
  proAnnual: {
    price: string;
    cadence: string;
    effectiveMonthly: string;
    savings: string;
    ctaHref: string;
  };
  proPlanBase: Plan;
};

export default function PlansGrid({
  free,
  agreement,
  proMonthly,
  proAnnual,
  proPlanBase,
}: PlansGridProps) {
  const [annual, setAnnual] = useState(false);
  const proActive = annual ? proAnnual : proMonthly;

  return (
    <>
      <div className={brand.billingControls}>
        <div
          className={brand.billingToggle}
          role="group"
          aria-label="Pro billing frequency"
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            aria-pressed={!annual}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
          >
            Annual <small>Save 10%</small>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className={brand.planGrid}>
        {/* Free */}
        <PlanCard
          plan={free}
          priceBlock={
            <>
              <span className={brand.price}>$0</span>
              <span className={brand.cadence}>forever</span>
            </>
          }
        />

        {/* Agreement */}
        <PlanCard
          plan={agreement}
          priceBlock={
            <>
              <span className={brand.price}>$49</span>
              <span className={brand.cadence}>one-time per agreement</span>
            </>
          }
        />

        {/* Pro */}
        <PlanCard
          plan={{ ...proPlanBase, ctaHref: proActive.ctaHref }}
          priceBlock={
            annual ? (
              <>
                <span className={brand.price}>
                  {proAnnual.effectiveMonthly}
                </span>
                <span className={brand.cadence}>per month, billed yearly</span>
                <div className={brand.annualNote}>
                  {proAnnual.price} billed yearly
                  <br />
                  {proAnnual.savings}
                </div>
              </>
            ) : (
              <>
                <span className={brand.price}>{proMonthly.price}</span>
                <span className={brand.cadence}>{proMonthly.cadence}</span>
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

function PlanCard({
  plan,
  priceBlock,
}: {
  plan: Plan;
  priceBlock: React.ReactNode;
}) {
  return (
    <article
      className={`${brand.plan} ${plan.highlighted ? brand.featuredPlan : ""}`}
    >
      {plan.highlighted && (
        <p className={brand.planBadge}>For ongoing monitoring</p>
      )}
      <h3>{plan.name}</h3>
      <div>{priceBlock}</div>
      <p className={brand.planDescription}>{plan.description}</p>
      <ul className={brand.planFeatures}>
        {plan.features.map((feature) => (
          <li key={feature}>
            <span aria-hidden="true">✓</span>
            <span>{feature}</span>
          </li>
        ))}
        {plan.missing.map((feature) => (
          <li key={feature} data-missing="true">
            <span aria-hidden="true">—</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link href={plan.ctaHref} className={brand.planCta}>
        {plan.cta}
        <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}

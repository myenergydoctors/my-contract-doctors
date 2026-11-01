import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import brand from "./BrandSections.module.css";

import { headerPhotos } from "./headerPhotos";

export function BrandHero({
  eyebrow,
  title,
  description,
  image = "invoice",
  imagePosition,
  caption,
  actions,
  note,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  image?: keyof typeof headerPhotos;
  imagePosition?: string;
  caption?: string;
  actions?: ReactNode;
  note?: string;
}) {
  return (
    <section className={brand.hero}>
      <div className={brand.heroInner}>
        <div className={brand.heroCopy}>
          <p className={brand.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          <p className={brand.description}>{description}</p>
          {actions && <div className={brand.actions}>{actions}</div>}
          {note && <p className={brand.heroNote}>{note}</p>}
        </div>
        <div className={brand.heroPhoto}>
          <Image
            src={headerPhotos[image].src}
            alt=""
            fill
            preload
            sizes="(max-width: 760px) 100vw, 45vw"
            style={{
              objectFit: "cover",
              objectPosition: imagePosition || headerPhotos[image].position,
            }}
          />
          <div className={brand.photoShade} />
          <div className={brand.photoCaption}>
            <span className={brand.captionRule} />
            {caption || "The everyday service behind every line item."}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProcessSection({
  eyebrow = "A clear path forward",
  title,
  description,
  steps,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  steps: { title: string; body: string }[];
}) {
  return (
    <section className={brand.process}>
      <div className={brand.container}>
        <div className={brand.sectionHeading}>
          <div>
            <p className={brand.eyebrow}>{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          {description && <p>{description}</p>}
        </div>
        <ol className={brand.steps}>
          {steps.map((step, index) => (
            <li key={step.title}>
              <div className={brand.stepRail}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <StepIcon index={index} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function StepIcon({ index }: { index: number }) {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {index === 0 ? (
        <>
          <path d="M19 4H8v24h17V10zM19 4v7h6M12 17h9M12 22h6" />
        </>
      ) : index === 1 ? (
        <>
          <rect x="5" y="4" width="22" height="24" rx="2" />
          <path d="m10 11 2 2 4-5M18 11h4m-12 9 2 2 4-5m2 3h4" />
        </>
      ) : (
        <>
          <path d="M12 23h8M13 27h6M11 19a8 8 0 1 1 10 0l-1 4h-8zM16 3V1M5 7 3 5m24 2 2-2" />
        </>
      )}
    </svg>
  );
}

export function DocumentAccountGate({
  kind,
}: {
  kind: "invoice" | "agreement";
}) {
  const invoice = kind === "invoice";
  const path = invoice ? "%2Finvoice" : "%2Fagreement";
  return (
    <>
      <BrandHero
        eyebrow={
          invoice
            ? "The Invoice · Free to start"
            : "The Agreement · Your private review"
        }
        title={
          invoice ? (
            <>
              Every charge has a story.
              <br />
              <em>Let’s read yours.</em>
            </>
          ) : (
            <>
              Your agreement.
              <br />
              <em>Your next move.</em>
            </>
          )
        }
        description={
          invoice
            ? "Create a free account or sign in to review your uniform and linen invoice. Your original file, corrections, and saved result stay together, from upload to review."
            : "Create a free account or sign in before uploading your agreement. Your document, clause preview, corrections, and saved analysis stay linked to you."
        }
        image={kind}
        caption={
          invoice
            ? "A closer look at what you pay for, every week."
            : "Understand the terms behind your everyday service."
        }
        actions={
          <>
            <Link href={`/sign-up?redirect=${path}`} className={brand.primary}>
              Create free account <span aria-hidden="true">↗</span>
            </Link>
            <Link
              href={`/sign-in?redirect=${path}`}
              className={brand.secondary}
            >
              Sign in <span aria-hidden="true">↗</span>
            </Link>
          </>
        }
        note={
          invoice
            ? "First confirmed invoice opportunity free. You decide what comes next."
            : "One free clause preview. Explore a full review when you’re ready."
        }
      />
      <ProcessSection
        title={
          <>
            From document to understanding.
            <br />
            <em>One clear step at a time.</em>
          </>
        }
        description="You stay involved in the review. We help you understand the details before you decide what to do next."
        steps={
          invoice
            ? [
                {
                  title: "Bring your latest invoice",
                  body: "Upload one PDF or clear photo of your uniform or linen service bill.",
                },
                {
                  title: "Confirm the details",
                  body: "Review the extracted line items, charges, and totals before analysis.",
                },
                {
                  title: "See where to look first",
                  body: "Get one free, evidence-backed opportunity when your invoice contains enough verified information.",
                },
              ]
            : [
                {
                  title: "Bring every page",
                  body: "Upload your complete agreement as a PDF or clear, readable photos.",
                },
                {
                  title: "Review the language",
                  body: "See a clause preview and check the details that were extracted from your document.",
                },
                {
                  title: "Know what to ask",
                  body: "Use the review to understand your terms and decide what to discuss with your provider.",
                },
              ]
        }
      />
      <section className={brand.assurance}>
        <div className={brand.container}>
          <span aria-hidden="true">↗</span>
          <div>
            <h2>
              Your documents. Your account.
              <br />
              <em>A clearer picture.</em>
            </h2>
            <p>
              Return to your saved review, keep your corrections together, and
              take the next step at your own pace.
            </p>
          </div>
          <Link href="/pricing" className={brand.textLink}>
            Explore the plans →
          </Link>
        </div>
      </section>
    </>
  );
}

export function FlowProgress({
  active,
  title,
}: {
  active: number;
  title: string;
}) {
  return (
    <div className={brand.flowHeader}>
      <div className={brand.container}>
        <p className={brand.eyebrow}>{title}</p>
        <ol aria-label="Review progress" className={brand.flowSteps}>
          {["Upload", "Email", "Analyze", "Confirm"].map((label, index) => (
            <li
              key={label}
              aria-current={index === active ? "step" : undefined}
              data-complete={index < active}
            >
              <span>
                {index < active ? "✓" : String(index + 1).padStart(2, "0")}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

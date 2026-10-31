import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import HeroMedia from "./HeroMedia";
import styles from "./HomeContent.module.css";

const services = [
  { name: "Uniforms & workwear", detail: "Rental, replacement & loss charges", image: "uniforms", position: "center", number: "01" },
  { name: "Towels & linens", detail: "Inventory, minimums & service fees", image: "linens", position: "center", number: "02" },
  { name: "Floor mats", detail: "Delivery frequency & recurring rentals", image: "mats", position: "center 72%", number: "03" },
];

export default function HomeContent({ testimonials }: { testimonials: ReactNode }) {
  return (
    <main className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-title">
        <HeroMedia />
        <div className={styles.heroShade} />
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>For the business behind the busy day</p>
          <h1 id="home-title">Every uniform.<br />Every mat.<br /><em>Every dollar matters.</em></h1>
          <p className={styles.heroCopy}>Know what your uniform and linen service is really costing you. Turn complicated invoices and agreements into clear next steps.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/invoice">Check my invoice — free <span aria-hidden="true">↗</span></Link>
            <a className={styles.secondary} href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a>
          </div>
          <p className={styles.heroNote}>Start with one free recommendation. Keep control of what happens next.</p>
        </div>
        <div className={styles.heroFoot}><span>Independent invoice & agreement analysis</span><span>Clarity for your next vendor conversation <span aria-hidden="true">↗</span></span></div>
      </section>

      <section className={styles.services} aria-labelledby="services-title">
        <div className={styles.sectionTop}><div><p className={styles.eyebrow}>The everyday essentials. The overlooked costs.</p><h2 id="services-title">You see the service.<br /><em>We help you see the bill.</em></h2></div><p>From the shirts on your team to the mats at your door, small recurring charges deserve a closer look.</p></div>
        <div className={styles.serviceGrid}>{services.map(service => <Link href="/invoice" className={styles.serviceCard} key={service.name}>
          <div className={styles.servicePhoto}><Image src={`/images/home/${service.image}.webp`} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" style={{ objectFit: "cover", objectPosition: service.position }} /><span>{service.number}</span></div>
          <div className={styles.serviceCaption}><h3>{service.name}</h3><span aria-hidden="true">↗</span><p>{service.detail}</p></div>
        </Link>)}</div>
        <p className={styles.also}>Also on your invoice? <span>Shop towels & rags</span><span>Restroom supplies</span><span>Delivery & environmental fees</span></p>
      </section>

      <section id="how-it-works" className={styles.process} aria-labelledby="process-title">
        <div className={styles.processHeading}><p className={styles.eyebrow}>Less guesswork. More understanding.</p><h2 id="process-title">A clearer bill.<br /><em>A better conversation.</em></h2><Link href="/invoice" className={styles.textLink}>Start with your invoice <span aria-hidden="true">↗</span></Link></div>
        <div className={styles.steps}>{[
          ["01", "Bring your latest invoice", "Upload a PDF or photo of your uniform or linen service invoice."],
          ["02", "Check the details", "Confirm the extracted line items and totals so the analysis starts with the right information."],
          ["03", "Take your next step", "See a free recommendation when your invoice contains the facts needed, then explore a deeper review."],
        ].map(([number, title, copy]) => <div key={number} className={styles.step}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}</div>
      </section>

      <section className={styles.reportSection} aria-labelledby="report-title">
        <div className={styles.reportVisual}>
          <div className={styles.reportSheet}><div className={styles.reportTop}><span>MY CONTRACT DOCTORS</span><span>Illustrative example</span></div><h3>A closer look at<br />your weekly invoice.</h3><div className={styles.reportLine}><span>Uniform rental</span><span>Review quantities</span></div><div className={styles.reportLine}><span>Mat service</span><span>Check frequency</span></div><div className={styles.reportLine}><span>Replacement charges</span><span>Check agreement</span></div><div className={styles.finding}><span>YOUR NEXT CONVERSATION</span><p>“Can you show me how this replacement charge was calculated?”</p></div><p className={styles.exampleNote}>Example only. Findings depend on your documents.</p></div>
          <div className={styles.reportBadge}><span aria-hidden="true">✓</span> Understand the charge.<br />Know what to ask.</div>
        </div>
        <div className={styles.reportCopy}><p className={styles.eyebrow}>The Invoice</p><h2 id="report-title">Make the small print<br /><em>make sense.</em></h2><p>A recurring charge can be easy to miss when you’re running a business. See where your invoice deserves attention, with explanations you can use in a real conversation.</p><ul><li>Review line items and recurring fees</li><li>Understand the facts behind a recommendation</li><li>Decide what to ask your provider next</li></ul><Link className={styles.primary} href="/invoice">Review my invoice <span aria-hidden="true">↗</span></Link></div>
      </section>

      <section className={styles.tools} aria-labelledby="tools-title"><div className={styles.sectionTop}><div><p className={styles.eyebrow}>Go beyond the weekly bill</p><h2 id="tools-title">Know your agreement.<br /><em>Before your next renewal.</em></h2></div><p>Your invoice is one part of the picture. Get clear on the terms behind it, too.</p></div><div className={styles.toolGrid}><Link href="/demystifier"><span className={styles.eyebrow}>The Demystifier <span aria-hidden="true">↗</span></span><h3>Contract language.<br />Human explanations.</h3><p>Explore common uniform service terms, renewal clauses, and questions worth asking.</p><strong>Explore the guide →</strong></Link><Link href="/agreement"><span className={styles.eyebrow}>The Agreement <span aria-hidden="true">↗</span></span><h3>Your actual contract.<br />A more personal review.</h3><p>Bring your service agreement for an analysis of its terms and potential negotiation points.</p><strong>See agreement analysis →</strong></Link></div></section>
      {testimonials}
      <section className={styles.finalCta}><p className={styles.eyebrow}>You’ve got a business to run.</p><h2>Let’s make your next<br /><em>vendor conversation count.</em></h2><Link className={styles.primary} href="/invoice">Start my free invoice review <span aria-hidden="true">↗</span></Link><Link href="/pricing" className={styles.secondary}>Explore plans →</Link></section>
    </main>
  );
}

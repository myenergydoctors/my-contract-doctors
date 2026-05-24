export type Industry = {
  slug: string;
  name: string;
  shortName: string;
  hero: string;
  heroItalic: string;
  intro: string;
  avgSpend: string;
  avgSavings: string;
  topPains: { title: string; body: string }[];
  vendorsCommon: string[];
  caseStudySlug?: string;
  faqs: { q: string; a: string }[];
};

export const industries: Record<string, Industry> = {
  restaurants: {
    slug: "restaurants",
    name: "Restaurants & Hospitality",
    shortName: "restaurants",
    hero: "Audit the bill that quietly grows every year.",
    heroItalic: "Restaurants overpay 28%.",
    intro: "Aprons, towels, floor mats, restroom service, linens. A typical mid-size restaurant signs a 5-year uniform contract and never reads it again — while the monthly bill creeps up 4–6% a year and surcharges multiply.",
    avgSpend: "$900 – $1,800 / month",
    avgSavings: "$3,200 – $7,800 / year",
    topPains: [
      { title: "Floor mats at 2–3× market", body: "Restaurants get billed for floor mat rental at rates where buying outright pays back in 4–8 months. Almost no one runs the math." },
      { title: "Minimum billing on slow weeks", body: "Closed for Thanksgiving? Hurricane day? Slow January? You're still paying the full weekly minimum unless you negotiated reconciliation." },
      { title: "Apron and uniform 'loss charges'", body: "Vendor-set replacement rates run 3–5× actual cost. Without a contractual cap, this line item alone can run thousands a year." },
      { title: "Stealth fuel and environmental fees", body: "Most contracts let vendors add surcharges 'at company discretion.' Restaurants typically don't notice until they total 8–12% of the bill." },
    ],
    vendorsCommon: ["Cintas", "UniFirst", "ALSCO", "Aramark"],
    caseStudySlug: "regional-restaurant-group",
    faqs: [
      { q: "We have multiple locations — does that matter?", a: "Yes, in two ways. First, multi-location restaurant groups often have inconsistent pricing across locations from the same vendor. Second, exclusivity clauses can technically cover any future location you open. We catch both." },
      { q: "What about our towel and linen service?", a: "Same vendors typically. We audit it all in one pass — uniforms, aprons, towels, linens, mats, restroom, all of it." },
      { q: "Will the vendor retaliate if we dispute?", a: "In our experience, no. Vendors take written disputes seriously because the alternative is losing the account. We've never seen a dispute lead to service changes." },
    ],
  },
  healthcare: {
    slug: "healthcare",
    name: "Healthcare Facilities",
    shortName: "healthcare facilities",
    hero: "Linen contracts that should never have been signed as-is.",
    heroItalic: "Hospitals overpay 32%.",
    intro: "Scrubs, surgical linens, patient gowns, isolation gowns, restroom service, bed linens. Healthcare linen contracts are among the largest recurring service expenses in any facility — and procurement teams rarely have time to audit them line-by-line.",
    avgSpend: "$8,000 – $80,000 / month",
    avgSavings: "$36,000 – $360,000 / year",
    topPains: [
      { title: "Replacement charges at 3–5× market", body: "Loss-and-damage charges use vendor-published replacement rates that grow far faster than CPI. Without a cap, this becomes a profit center for the vendor." },
      { title: "Minimum billing on low-census weeks", body: "When census drops, your linen usage drops — but your invoice doesn't, unless you negotiated reconciliation." },
      { title: "Volume-tier games", body: "Promised volume tiers often aren't applied automatically. We've found six-figure annual gaps where facilities qualified for better tiers but were billed at the lower one." },
      { title: "Compliance and quality misses", body: "Healthcare-grade contracts often spell out specific quality thresholds. When vendors miss them, there are usually credits owed that go unclaimed." },
    ],
    vendorsCommon: ["UniFirst", "Cintas", "ImageFirst", "ALSCO"],
    caseStudySlug: "community-hospital",
    faqs: [
      { q: "We have a multi-year master agreement — can we still get savings?", a: "Yes. Most master agreements are violated by the vendor (above-cap escalators, unauthorized surcharges, missed volume tiers) within the first 12 months. We find these for you." },
      { q: "We're not approaching renewal — is it still worth it?", a: "Often more so. Pre-renewal audits find systematic overcharges that can be credited back. Post-audit, you also have leverage for renewal negotiations." },
      { q: "How does this work with our procurement process?", a: "We produce written findings, dispute correspondence, and a renegotiation package that your procurement team can use directly. We don't replace your team — we give them ammunition." },
    ],
  },
  manufacturing: {
    slug: "manufacturing",
    name: "Manufacturing",
    shortName: "manufacturing plants",
    hero: "Uniform contracts that lock you in for 5 years.",
    heroItalic: "Manufacturers overpay 26%.",
    intro: "Shop uniforms, FR-rated gear, shop rags, gloves, floor mats, parts cleaning, industrial linens. Manufacturing uniform programs are big, complex, and rarely audited — and the contracts that govern them are often written with very long terms and limited customer protections.",
    avgSpend: "$3,000 – $25,000 / month",
    avgSavings: "$13,000 – $112,000 / year",
    topPains: [
      { title: "5-year auto-renewals", body: "Manufacturing uniform contracts are typically 60-month terms that auto-renew for another 36 months. Miss the 90-day notice window and you're locked in." },
      { title: "Per-garment 'loss' charges", body: "FR-rated and shop uniforms run $40–$120 each at vendor replacement rates — 4–5× actual cost. With high turnover, this adds up fast." },
      { title: "Exclusivity covering new locations", body: "If you open a second plant, that location may be technically subject to the existing exclusivity clause. We've seen this trigger expensive 'amendment' fees." },
      { title: "Industrial parts cleaning markups", body: "Cleaning solvent and parts washer service charges are often bundled into uniform invoices with no visibility. We unbundle them and benchmark." },
    ],
    vendorsCommon: ["Cintas", "UniFirst", "ALSCO", "G&K Services"],
    caseStudySlug: "manufacturing-facility",
    faqs: [
      { q: "Our HR or operations team manages this — should they be involved?", a: "Yes. We typically work with whoever signs the contract. We produce written analysis they can review and decide what to do with." },
      { q: "What about FR-rated and specialized garment programs?", a: "We handle these. They're typically the most expensive line items and the most lenient on vendor-side margins, which is exactly why they're worth auditing." },
      { q: "We have an RFP coming up — can you help?", a: "Yes. Our contract analysis is especially valuable pre-RFP because it gives you concrete data to negotiate with — average market rates, common clauses to demand, and red flags to reject." },
    ],
  },
};

export function getIndustry(slug: string): Industry | undefined {
  return industries[slug];
}

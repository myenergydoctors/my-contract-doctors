export type CaseStudy = {
  slug: string;
  business: string;
  businessType: string;
  location: string;
  vendor: string;
  headline: string;
  subhead: string;
  annualSavings: number;
  contractValue: number;
  reductionPct: number;
  problem: string;
  approach: string;
  outcome: string;
  quote: string;
  quoteAttribution: string; // role only, not a name
  flaggedItems: { item: string; issue: string; savings: number }[];
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "regional-restaurant-group",
    business: "Regional Restaurant Group",
    businessType: "Casual dining · 14 locations",
    location: "New England",
    vendor: "Cintas",
    headline: "$48,200 a year on a uniform contract nobody had reread in 6 years.",
    subhead: "A 14-unit restaurant group thought their uniform contract was 'just one of those fixed costs.' It wasn't.",
    annualSavings: 48200,
    contractValue: 168000,
    reductionPct: 29,
    problem: "The group's regional manager flagged that one location's uniform invoice had quietly grown from $720/month to $1,180/month over four years, with no visible explanation. The 6-year contract had auto-renewed twice. Nobody on the operations team had read the original agreement since signing it.",
    approach: "We analyzed the contract and a representative sample of invoices from 6 of their 14 locations. We found three problems pattern: (1) the contract's annual price escalator was being applied above its stated cap, (2) every location was being charged for floor mat service at roughly 2.3× market rate, and (3) a 'facility services' line item had been added to all invoices in 2024 with no contractual basis. We drafted dispute correspondence and a renegotiation proposal.",
    outcome: "Within six weeks the vendor credited back $14,200 in retroactive overcharges and renegotiated the agreement to remove the facility services line, cap the escalator at 3%, and reprice floor mats at market. The annualized savings across all 14 locations was $48,200 — roughly 29% of their previous uniform spend.",
    quote: "We thought we were stuck in a 6-year deal. Turns out there were a number of items on the invoice that didn't match what the contract said. We just didn't know what to look for.",
    quoteAttribution: "Director of Operations",
    flaggedItems: [
      { item: "Price escalator applied above contractual cap", issue: "Cap was 3% — vendor was applying 5.5%", savings: 19400 },
      { item: "Floor mat overcharge (2.3× market)", issue: "Buying outright pays back in 7 months", savings: 16800 },
      { item: "'Facility services' line item not in original contract", issue: "No contractual basis — added in 2024", savings: 12000 },
    ],
  },
  {
    slug: "community-hospital",
    business: "Community Hospital",
    businessType: "Acute care · 180 beds",
    location: "Midwest",
    vendor: "UniFirst",
    headline: "$214,000 freed up by auditing one linen agreement.",
    subhead: "A community hospital's procurement team suspected they were overpaying for surgical linens but didn't have time for a line-by-line review.",
    annualSavings: 214000,
    contractValue: 720000,
    reductionPct: 30,
    problem: "Hospital procurement runs lean and they had not formally audited their linen contract since 2019. Anecdotal reports from the laundry coordinator suggested damaged-item replacement charges had skyrocketed and minimum weekly billing was being applied even on low-census weeks. The contract was up for renewal in 9 months.",
    approach: "We reviewed the agreement against 36 months of invoices. Three structural issues surfaced: (1) the loss-and-damage charge schedule was using the vendor's 'published replacement rates' which had grown 4× since the contract was signed without notification, (2) minimum weekly billing was being applied even when actual usage was well below the minimum, with no end-of-year reconciliation provision, and (3) a fuel surcharge had been added in 2022 with no contractual right to do so. We built a negotiation package for the renewal.",
    outcome: "The renewed contract: capped replacement rates at 1.5× actual cost, removed the fuel surcharge that wasn't in the original agreement, and added a reconciliation clause for under-utilization. Combined with retroactive credits, the hospital saved $214,000 in the first 12 months. The procurement team estimates the contract is now $1M+ better over its 5-year term.",
    quote: "The cleaner-than-clean version is — we had no idea how much room we had to negotiate until someone actually read the contract front-to-back and showed us the math.",
    quoteAttribution: "Director of Procurement",
    flaggedItems: [
      { item: "Replacement charges at 4× market", issue: "Vendor used their own escalating pricebook", savings: 96000 },
      { item: "Minimum billing on low-census weeks", issue: "No reconciliation for under-utilization", savings: 68000 },
      { item: "Fuel surcharge added in 2022", issue: "Not present in original contract terms", savings: 50000 },
    ],
  },
  {
    slug: "manufacturing-facility",
    business: "Mid-Size Manufacturing Facility",
    businessType: "Precision parts · 220 employees",
    location: "Pacific Northwest",
    vendor: "ALSCO",
    headline: "$67,400 a year — and they almost auto-renewed the same bad deal.",
    subhead: "A precision-parts manufacturer almost auto-renewed a 5-year uniform contract with three high-impact clauses they hadn't fully understood.",
    annualSavings: 67400,
    contractValue: 240000,
    reductionPct: 28,
    problem: "The plant's controller received the standard 60-day pre-renewal notification from their uniform vendor and reflexively forwarded it to operations to sign. The CFO happened to ask whether anyone had actually compared the renewal terms against market — and the honest answer was no. They had 30 days before auto-renewal kicked in for another 5 years.",
    approach: "We analyzed both the existing agreement and the proposed renewal. The existing contract contained an exclusivity clause covering every facility location (including a second site they had opened in 2023 with a different supplier — a technical violation they hadn't realized). The renewal had a 4% annual price escalator with no cap, an unlimited 'pass-through' clause for fuel and environmental surcharges, and a 50% early termination fee. We helped them put out an RFP and used the analysis as leverage with three vendors.",
    outcome: "They moved to a 3-year (not 5-year) agreement with a different vendor at 28% lower base pricing, a 2% CPI-tied escalator cap, and no exclusivity clause. Their annualized savings were $67,400, and they avoided a 5-year lock-in to a contract they would have regretted.",
    quote: "If we had auto-renewed, we'd have signed up for another five years of escalating costs and a clause that technically made one of our locations a contract breach. That's a real number — we just didn't see it.",
    quoteAttribution: "Chief Financial Officer",
    flaggedItems: [
      { item: "Auto-renewal for 5 more years", issue: "Existing terms 28% above market", savings: 35000 },
      { item: "Uncapped price escalator", issue: "4% annual compounding, no CPI tie", savings: 18400 },
      { item: "Exclusivity covering future sites", issue: "Technically a breach already", savings: 14000 },
    ],
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find(c => c.slug === slug);
}

// Seeded mock data for the customer portal UI.
// Swap with Supabase queries once auth + DB are wired.

export type Risk = "high" | "medium" | "low";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  businessName: string;
  plan: "free" | "demystifier" | "agreement" | "pro";
  joinedAt: string;
  avatarInitials: string;
};

export const mockUser: MockUser = {
  id: "u_demo_001",
  name: "Jane Smith",
  email: "jane@ragged-coast.com",
  businessName: "Ragged Coast Chocolates",
  plan: "pro",
  joinedAt: "2026-01-14",
  avatarInitials: "JS",
};

export type InvoiceAnalysis = {
  id: string;
  uploadedAt: string;
  vendor: string;
  invoiceNumber: string;
  totalSpend: number;
  potentialAnnualSavings: number;
  flaggedItemCount: number;
  status: "completed" | "processing";
  topFinding: string;
  lineItems: Array<{
    item: string;
    monthlyCost: number;
    flagged: boolean;
    issue?: string;
    suggestion?: string;
    savings?: number;
  }>;
};

export const mockInvoices: InvoiceAnalysis[] = [
  {
    id: "inv_2026_04",
    uploadedAt: "2026-04-22",
    vendor: "ImageFirst",
    invoiceNumber: "IF-884201",
    totalSpend: 1487,
    potentialAnnualSavings: 4920,
    flaggedItemCount: 5,
    status: "completed",
    topFinding: "Floor mats charged at 2.4× market rate — switching to ownership saves $2,140/yr.",
    lineItems: [
      { item: "Uniforms (weekly rental)", monthlyCost: 284, flagged: false },
      { item: "Floor mats × 12", monthlyCost: 520, flagged: true, issue: "Severely overpriced", suggestion: "Purchase commercial mats outright — pays back in 4 months", savings: 2140 },
      { item: "Shop rags (bulk)", monthlyCost: 148, flagged: true, issue: "Marked up 3×", suggestion: "Order direct from a janitorial supplier", savings: 980 },
      { item: "Restroom supplies", monthlyCost: 96, flagged: false },
      { item: "Facility service charge", monthlyCost: 89, flagged: true, issue: "Vague line item with no negotiated cap", suggestion: "Demand itemization or removal — typically removable", savings: 1068 },
      { item: "Fuel surcharge", monthlyCost: 24, flagged: true, issue: "Not present in original agreement", suggestion: "Request removal — added without notice", savings: 288 },
      { item: "Environmental fee", monthlyCost: 18, flagged: true, issue: "Charged on top of base rental", suggestion: "Verify against contract — often not contractually permitted", savings: 216 },
      { item: "Linen restock", monthlyCost: 308, flagged: false },
    ],
  },
  {
    id: "inv_2026_03",
    uploadedAt: "2026-03-19",
    vendor: "ImageFirst",
    invoiceNumber: "IF-879043",
    totalSpend: 1452,
    potentialAnnualSavings: 4680,
    flaggedItemCount: 4,
    status: "completed",
    topFinding: "Same overcharges as April — vendor has not responded to dispute letter.",
    lineItems: [],
  },
  {
    id: "inv_2026_02",
    uploadedAt: "2026-02-18",
    vendor: "ImageFirst",
    invoiceNumber: "IF-873112",
    totalSpend: 1438,
    potentialAnnualSavings: 4560,
    flaggedItemCount: 4,
    status: "completed",
    topFinding: "First flagged invoice. Dispute letter sent on March 2.",
    lineItems: [],
  },
];

export type AgreementAnalysis = {
  id: string;
  uploadedAt: string;
  vendor: string;
  agreementName: string;
  riskScore: number; // 0–100, higher is worse
  termLength: string;
  autoRenewal: string;
  topActions: Array<{ title: string; body: string; impact: number }>;
  clauses: Array<{
    id: string;
    label: string;
    risk: Risk;
    annualImpact?: number;
    yourLanguage: string;
    plainEnglish: string;
  }>;
};

export const mockAgreements: AgreementAnalysis[] = [
  {
    id: "agr_imagefirst_2024",
    uploadedAt: "2026-01-15",
    vendor: "ImageFirst (Berstein-Magoon-Gay LLC)",
    agreementName: "Service Agreement — 60 month term",
    riskScore: 78,
    termLength: "60 months",
    autoRenewal: "Auto-renews for 36 months unless written notice given 90 days before expiration",
    topActions: [
      { title: "Send auto-renewal notice now", body: "Your renewal window opens June 15, 2026. Send written notice before then to retain leverage.", impact: 0 },
      { title: "Dispute the floor-mat overcharge", body: "We've drafted a negotiation email — send it to challenge the 2.4× market-rate pricing.", impact: 2140 },
      { title: "Demand itemization of facility service charge", body: "This vague $89/mo line is typically removable when challenged.", impact: 1068 },
    ],
    clauses: [
      { id: "cl_term", label: "Term & Auto-Renewal", risk: "high", annualImpact: 0, yourLanguage: "This Agreement shall commence on the date set forth above and continue for a period of sixty (60) months. Upon expiration, this Agreement shall automatically renew for successive thirty-six (36) month terms unless either party provides written notice of non-renewal not less than ninety (90) days prior to the end of the then-current term.", plainEnglish: "You're locked in for 5 years, and unless you remember to mail (not email) a notice exactly 90 days before the contract ends, it auto-renews for another 3 years. This is the single biggest leverage problem in the contract." },
      { id: "cl_minbill", label: "Minimum Weekly Billing", risk: "high", annualImpact: 1680, yourLanguage: "Customer agrees to maintain a minimum weekly service charge of $295.00, regardless of actual quantity of items rented or services rendered.", plainEnglish: "You pay $295/week even if you take a week off, close for a holiday, or reduce service. There's no flex." },
      { id: "cl_loss", label: "Loss & Damage", risk: "medium", annualImpact: 480, yourLanguage: "Customer shall be liable for the replacement cost of any garment lost, damaged, or stained beyond reasonable wear and tear, at the Company's then-current published replacement rates.", plainEnglish: "Replacement charges use the vendor's own pricebook — typically 3–5× actual cost. Worth negotiating a cap." },
      { id: "cl_pricing", label: "Pricing Adjustment", risk: "medium", annualImpact: 380, yourLanguage: "Company reserves the right to adjust pricing annually upon thirty (30) days' written notice, based on changes in cost of goods, labor, or fuel.", plainEnglish: "Vendor can raise prices once a year with only 30 days notice. No cap. You can negotiate a CPI-tied cap." },
      { id: "cl_exclusive", label: "Exclusivity", risk: "high", annualImpact: 0, yourLanguage: "Customer shall use Company exclusively for all uniform, linen, and facility services during the Term, including any new locations opened by Customer.", plainEnglish: "You can't use any other supplier for anything similar, including at new locations. This is unusually broad." },
      { id: "cl_addons", label: "Surcharges & Fees", risk: "medium", annualImpact: 504, yourLanguage: "Customer acknowledges that surcharges including but not limited to fuel, environmental, and energy may be added to invoices from time to time at Company's discretion.", plainEnglish: "Vendor can add surcharges at any time. Most contracts let them do this. Worth a 'no new fees without 90 days notice and right to terminate' addendum." },
      { id: "cl_termfee", label: "Early Termination Fee", risk: "high", annualImpact: 0, yourLanguage: "If Customer terminates this Agreement prior to expiration for any reason other than Company's uncured material breach, Customer shall pay liquidated damages equal to fifty percent (50%) of the remaining contract value.", plainEnglish: "Walking away early costs you 50% of whatever's left. On a 5-year deal that's a $30k+ exit fee. Negotiate this down to 6 months of service value." },
      { id: "cl_disputes", label: "Dispute Resolution", risk: "low", yourLanguage: "Any dispute arising under this Agreement shall be resolved by binding arbitration in the state of Pennsylvania.", plainEnglish: "Disputes go to arbitration in Pennsylvania (the vendor's home state), not your local courts. Standard but worth knowing." },
    ],
  },
];

// Industry insights — aggregate data across the user base.
// Mocked. Real version queries the analyses table across all orgs.
export const mockInsights = {
  totalAnalyzedContracts: 1247,
  totalIdentifiedSavings: 4_283_400,
  averageSavingsPerContract: 3437,
  topVendors: [
    { name: "Cintas", contractsAnalyzed: 412, avgOverpaymentPct: 28 },
    { name: "UniFirst", contractsAnalyzed: 287, avgOverpaymentPct: 31 },
    { name: "ALSCO", contractsAnalyzed: 198, avgOverpaymentPct: 24 },
    { name: "ImageFirst", contractsAnalyzed: 156, avgOverpaymentPct: 35 },
    { name: "Aramark", contractsAnalyzed: 134, avgOverpaymentPct: 22 },
    { name: "G&K Services", contractsAnalyzed: 60, avgOverpaymentPct: 19 },
  ],
  mostCommonClauses: [
    { clause: "Auto-renewal 30+ months", frequency: 89 },
    { clause: "No price cap", frequency: 76 },
    { clause: "Exclusivity (all locations)", frequency: 71 },
    { clause: "50%+ early termination fee", frequency: 64 },
    { clause: "Vendor-priced replacement charges", frequency: 92 },
  ],
};

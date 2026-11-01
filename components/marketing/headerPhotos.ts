// Temporary free stock photography. Sources and replacement instructions: docs/hero-photography.md
export const headerPhotos = {
  pricing: { src: "/images/people/pricing.webp", position: "55% center" },
  invoice: { src: "/images/people/invoice.webp", position: "42% center" },
  agreement: { src: "/images/people/agreement-mechanic.webp", position: "center" },
  about: { src: "/images/people/about.webp", position: "center" },
  contact: { src: "/images/people/contact.webp", position: "center" },
  industries: { src: "/images/people/industries.webp", position: "center" },
  customers: { src: "/images/people/customers.webp", position: "center" },
  compare: { src: "/images/people/compare.webp", position: "center" },
  help: { src: "/images/people/help.webp", position: "center 40%" },
  blog: { src: "/images/people/blog.webp", position: "center" },
  demystifier: { src: "/images/people/demystifier.webp", position: "center" },
  reviews: { src: "/images/people/reviews.webp", position: "center 35%" },
  industry: { src: "/images/people/industry.webp", position: "center" },
  customer: { src: "/images/people/customer.webp", position: "center" },
  article: { src: "/images/people/article.webp", position: "center" },
  guide: { src: "/images/people/guide.webp", position: "center" },
  healthcare: { src: "/images/people/healthcare.webp", position: "center 35%" },
  manufacturing: {
    src: "/images/people/manufacturing.webp",
    position: "center 35%",
  },
  hospitalStory: {
    src: "/images/people/hospitalStory.webp",
    position: "center 35%",
  },
  factoryStory: {
    src: "/images/people/factoryStory.webp",
    position: "center 35%",
  },
};

export const industryPhotos = {
  restaurants: "industry",
  healthcare: "healthcare",
  manufacturing: "manufacturing",
} as const;
export const customerPhotos = {
  "regional-restaurant-group": "customer",
  "community-hospital": "hospitalStory",
  "manufacturing-facility": "factoryStory",
} as const;
export const articlePhotos = {
  "auto-renewal-clause": "article",
  "negotiate-cancellation-fee": "agreement",
  "cintas-vs-unifirst-vs-alsco": "industries",
  "ldp-protection-charge": "invoice",
  "floor-mat-rental-vs-purchase": "reviews",
  "service-charge-negotiation": "pricing",
  "minimum-billing": "compare",
  "uniform-contract-checklist": "about",
} as const;

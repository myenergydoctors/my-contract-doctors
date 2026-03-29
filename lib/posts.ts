export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryColor: "red" | "amber" | "blue" | "teal";
  date: string;
  readTime: string;
  featured?: boolean;
};

export const posts: Post[] = [
  {
    slug: "auto-renewal-clause",
    title: "The Auto-Renewal Clause That's Costing Businesses Thousands",
    excerpt: "Most uniform service agreements auto-renew for another full term if you don't send written notice 90 days before the end date. Here's how to protect yourself.",
    category: "Know Your Contract",
    categoryColor: "red",
    date: "March 18, 2026",
    readTime: "5 min read",
    featured: true,
  },
  {
    slug: "negotiate-cancellation-fee",
    title: "How to Negotiate Your Uniform Contract Cancellation Fee Down to $0",
    excerpt: "The 40% cancellation penalty in most uniform agreements is not set in stone. Here's the exact language to use when pushing back — and when to use it.",
    category: "Negotiation",
    categoryColor: "amber",
    date: "March 11, 2026",
    readTime: "7 min read",
  },
  {
    slug: "cintas-vs-unifirst-vs-alsco",
    title: "Cintas vs. UniFirst vs. ALSCO: Which Uniform Vendor Has the Fairest Contract?",
    excerpt: "We've analyzed contracts from all three major vendors. Here's how their terms, cancellation policies, and pricing structures actually compare.",
    category: "Vendor Comparison",
    categoryColor: "blue",
    date: "March 4, 2026",
    readTime: "9 min read",
  },
  {
    slug: "ldp-protection-charge",
    title: "LDP Protection: The Automatic Charge You Probably Didn't Notice",
    excerpt: "Loss Damage Protection is billed every week — whether you lose anything or not. We break down what it actually covers and how to get it removed.",
    category: "Know Your Contract",
    categoryColor: "red",
    date: "February 25, 2026",
    readTime: "4 min read",
  },
  {
    slug: "floor-mat-rental-vs-purchase",
    title: "Floor Mat Rental vs. Purchase: The Numbers Might Surprise You",
    excerpt: "Renting floor mats from your uniform vendor can cost $400–$800 per year per location. Owning them outright costs about $50 each. We do the math.",
    category: "Save Money",
    categoryColor: "teal",
    date: "February 18, 2026",
    readTime: "6 min read",
  },
  {
    slug: "service-charge-negotiation",
    title: "The Weekly Service Charge Is the First Thing You Should Negotiate",
    excerpt: "The service charge is pure margin for the vendor — and it's the first line item they'll raise every year. Here's exactly how to get it waived on a new account.",
    category: "Negotiation",
    categoryColor: "amber",
    date: "February 11, 2026",
    readTime: "5 min read",
  },
  {
    slug: "minimum-billing",
    title: "Minimum Billing Guarantees: What They Mean and Why They Matter",
    excerpt: "80% minimum billing means even if you lay off half your staff, you still owe most of your original weekly amount. Here's how to negotiate this before you sign.",
    category: "Know Your Contract",
    categoryColor: "red",
    date: "February 4, 2026",
    readTime: "5 min read",
  },
  {
    slug: "uniform-contract-checklist",
    title: "The 10-Point Checklist to Review Before Signing Any Uniform Contract",
    excerpt: "Don't sign without running through this checklist. Covers term length, auto-renewal, minimum billing, cancellation penalties, price escalators, and more.",
    category: "Resources",
    categoryColor: "blue",
    date: "January 28, 2026",
    readTime: "8 min read",
  },
];
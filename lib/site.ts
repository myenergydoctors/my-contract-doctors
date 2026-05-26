// Central place for site-wide constants used in metadata, sitemap, schema, etc.

export const SITE = {
  name: "My Contract Doctors",
  url: "https://mycontractdoctors.com",
  tagline: "Demystify Your Uniform Contract",
  description:
    "Upload your uniform or linen service agreement and invoice. We help you understand every clause and line item, identify savings opportunities, and give you the language to negotiate.",
  twitterHandle: "@mycontractdrs",
  email: "hello@mycontractdoctors.com",
};

// Routes that should appear in the sitemap, with priority + change freq hints.
export const SITEMAP_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/",                 priority: 1.0, changeFrequency: "weekly" },
  { path: "/pricing",          priority: 0.9, changeFrequency: "monthly" },
  { path: "/invoice",          priority: 0.9, changeFrequency: "monthly" },
  { path: "/agreement",        priority: 0.9, changeFrequency: "monthly" },
  { path: "/demystifier",      priority: 0.9, changeFrequency: "monthly" },
  { path: "/about",            priority: 0.7, changeFrequency: "monthly" },
  { path: "/customers",        priority: 0.7, changeFrequency: "monthly" },
  { path: "/industries",       priority: 0.7, changeFrequency: "monthly" },
  { path: "/compare",          priority: 0.7, changeFrequency: "monthly" },
  { path: "/free-guide",       priority: 0.6, changeFrequency: "monthly" },
  { path: "/blog",             priority: 0.7, changeFrequency: "weekly" },
  { path: "/help",             priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact",          priority: 0.5, changeFrequency: "yearly" },
];

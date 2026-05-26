import type { MetadataRoute } from "next";
import { SITE, SITEMAP_ROUTES } from "@/lib/site";
import { posts } from "@/lib/posts";
import { caseStudies } from "@/lib/case-studies";
import { industries } from "@/lib/industries";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base: MetadataRoute.Sitemap = SITEMAP_ROUTES.map(r => ({
    url: `${SITE.url}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Blog posts
  for (const p of posts) {
    base.push({
      url: `${SITE.url}/blog/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // Case studies
  for (const c of caseStudies) {
    base.push({
      url: `${SITE.url}/customers/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // Industry landing pages
  for (const i of Object.values(industries)) {
    base.push({
      url: `${SITE.url}/industries/${i.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return base;
}

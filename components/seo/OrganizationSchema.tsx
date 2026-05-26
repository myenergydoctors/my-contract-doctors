import { SITE } from "@/lib/site";

// Organization-level structured data. Render once in the root layout.
// Helps Google, Bing, and AI search understand who we are.
export default function OrganizationSchema() {
  const json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    email: SITE.email,
    sameAs: [
      "https://myenergydoctors.com",
      "https://360fuelcard.com",
      "https://oscwebdesign.biz",
    ],
    logo: `${SITE.url}/icon.svg`,
    foundingDate: "2026",
    knowsAbout: [
      "Uniform and linen service contracts",
      "Contract analysis",
      "Invoice auditing",
      "Vendor negotiation",
      "Recurring service expense management",
    ],
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

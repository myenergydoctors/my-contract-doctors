import { SITE } from "@/lib/site";

// Product-level schema for plan / product pages. Helps with Google's product
// rich results.

type ProductSchemaProps = {
  name: string;
  description: string;
  price: number;   // in dollars (will be formatted with USD)
  priceCurrency?: string;
  url?: string;
  type?: "service" | "subscription";
};

export default function ProductSchema({ name, description, price, priceCurrency = "USD", url, type = "service" }: ProductSchemaProps) {
  const fullUrl = url ? (url.startsWith("http") ? url : `${SITE.url}${url}`) : SITE.url;
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    brand: { "@type": "Brand", name: SITE.name },
    url: fullUrl,
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency,
      availability: "https://schema.org/InStock",
      url: fullUrl,
    },
  };
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

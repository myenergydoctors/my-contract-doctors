import { createClient } from "@/lib/supabase/server";
import { normalizeVendorDescription } from "@/lib/vendor-product-matching";

export { normalizeItemCode, normalizeVendorDescription } from "@/lib/vendor-product-matching";

export type VendorProduct = {
  id: string;
  vendor_id: string;
  vendor_item_code: string | null;
  display_name: string | null;
  source_key: string;
  product_id: string | null;
  mapping_source: "seed" | "ai" | "manual";
  catalog_status: "candidate" | "approved" | "rejected";
  times_seen: number;
  notes: string | null;
};

export function vendorProductSourceKey(itemCode: string | null, description: string): string {
  return `${itemCode || "NO-CODE"}::${normalizeVendorDescription(description)}`;
}

// Catalog rows for a set of vendors. Used by the extraction route to apply
// known SKU → product mappings deterministically instead of letting the AI
// re-guess codes we've already seen.
export async function listVendorProductsServer(vendorIds: string[]): Promise<VendorProduct[]> {
  if (vendorIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_products")
    .select("id, vendor_id, vendor_item_code, display_name, source_key, product_id, mapping_source, catalog_status, times_seen, notes")
    .in("vendor_id", vendorIds)
    .eq("catalog_status", "approved");
  if (error || !data) return [];
  return data as VendorProduct[];
}

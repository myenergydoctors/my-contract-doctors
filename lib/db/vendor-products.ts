import { createClient } from "@/lib/supabase/server";

export type VendorProduct = {
  id: string;
  vendor_id: string;
  vendor_item_code: string;
  display_name: string | null;
  product_id: string | null;
  mapping_source: "seed" | "ai" | "manual";
  times_seen: number;
  notes: string | null;
};

// Normalize an item code the same way everywhere: what the AI extracts,
// what we store, and what we look up must all agree.
export function normalizeItemCode(code: string): string {
  return code.trim().toUpperCase();
}

// Catalog rows for a set of vendors. Used by the extraction route to apply
// known SKU → product mappings deterministically instead of letting the AI
// re-guess codes we've already seen.
export async function listVendorProductsServer(vendorIds: string[]): Promise<VendorProduct[]> {
  if (vendorIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_products")
    .select("id, vendor_id, vendor_item_code, display_name, product_id, mapping_source, times_seen, notes")
    .in("vendor_id", vendorIds);
  if (error || !data) return [];
  return data as VendorProduct[];
}

import { createClient } from "@/lib/supabase/server";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  common_billing_unit: string | null;
  description: string | null;
};

// Server-side list. Used by the extraction route to build the AI prompt.
export async function listProductsServer(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, category, subcategory, common_billing_unit, description")
    .order("category")
    .order("name");
  if (error || !data) return [];
  return data as Product[];
}

import { createClient } from "@/lib/supabase/server";

export type Vendor = {
  id: string;
  slug: string;
  name: string;
  parent_company: string | null;
  aliases: string[];
  website: string | null;
};

export async function listVendorsServer(): Promise<Vendor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("id, slug, name, parent_company, aliases, website")
    .order("name");
  if (error || !data) return [];
  return data as Vendor[];
}

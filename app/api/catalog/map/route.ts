import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Assign (or clear) the normalized product for a vendor SKU. Manual mappings
// are the highest-trust tier — the extraction route applies them
// deterministically and never lets the AI overwrite them.
//
// Admin-only: vendor_products is shared reference data, so mapping is gated
// by ADMIN_EMAILS (comma-separated env var) rather than row ownership.

type MapRequestBody = {
  vendor_product_id: string;
  product_id: string | null; // null clears the mapping back to "needs review"
  notes?: string;
};

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = (await req.json()) as MapRequestBody;
  if (!body.vendor_product_id) {
    return NextResponse.json({ error: "vendor_product_id is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("vendor_products")
    .update({
      product_id: body.product_id ?? null,
      mapping_source: "manual",
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    })
    .eq("id", body.vendor_product_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

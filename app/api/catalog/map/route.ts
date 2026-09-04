import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReplacementTrackingCategory, type ReplacementTrackingEligibility } from "@/lib/service-replacement-history";

// Assign (or clear) the normalized product for a vendor SKU. Manual mappings
// are the highest-trust tier — the extraction route applies them
// deterministically and never lets the AI overwrite them.
//
// Admin-only: vendor_products is shared reference data, so mapping is gated
// by ADMIN_EMAILS (comma-separated env var) rather than row ownership.

type MapRequestBody = {
  vendor_product_id: string;
  product_id?: string | null; // null clears the mapping back to "needs review"
  notes?: string;
  replacement_tracking_eligibility?: ReplacementTrackingEligibility;
  replacement_tracking_category?: string | null;
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
  const update: Record<string, unknown> = {};
  if (Object.prototype.hasOwnProperty.call(body, "product_id")) {
    Object.assign(update, {
      product_id: body.product_id ?? null,
      mapping_source: "manual",
      catalog_status: body.product_id ? "approved" : "candidate",
      ...(!body.product_id ? {
        replacement_tracking_eligibility: "unreviewed",
        replacement_tracking_category: null,
        replacement_tracking_reviewed_by: null,
        replacement_tracking_reviewed_at: null,
      } : {}),
    });
  }
  if (body.replacement_tracking_eligibility !== undefined) {
    if (!["unreviewed", "eligible", "ineligible"].includes(body.replacement_tracking_eligibility)) {
      return NextResponse.json({ error: "Invalid replacement tracking eligibility." }, { status: 400 });
    }
    if (body.replacement_tracking_eligibility === "eligible" && !isReplacementTrackingCategory(body.replacement_tracking_category)) {
      return NextResponse.json({ error: "Choose an approved replacement category." }, { status: 400 });
    }
    const { data: row, error: rowError } = await admin.from("vendor_products").select("catalog_status").eq("id", body.vendor_product_id).maybeSingle();
    if (rowError) return NextResponse.json({ error: rowError.message }, { status: 500 });
    if ((row as { catalog_status?: string } | null)?.catalog_status !== "approved") {
      return NextResponse.json({ error: "Approve the catalog product before enabling replacement tracking." }, { status: 409 });
    }
    Object.assign(update, {
      replacement_tracking_eligibility: body.replacement_tracking_eligibility,
      replacement_tracking_category: body.replacement_tracking_eligibility === "eligible" ? body.replacement_tracking_category : null,
      replacement_tracking_reviewed_by: user.id,
      replacement_tracking_reviewed_at: new Date().toISOString(),
    });
  }
  if (body.notes !== undefined) update.notes = body.notes;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No catalog change was supplied." }, { status: 400 });
  }
  const { error } = await admin
    .from("vendor_products")
    .update(update)
    .eq("id", body.vendor_product_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

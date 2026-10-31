import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  publicReview,
  type CustomerReview,
  type ReviewContext,
  type PublicReview,
} from "./domain";

export class ReviewError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message);
  }
}
export async function reviewIdentity(adminOnly = false) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new ReviewError("Please sign in.", 401);
  // Canonical profile state, never user-editable metadata or browser demo state.
  const { data: profile, error: profileError } = await createAdminClient()
    .from("profiles")
    .select("is_admin,deactivated_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError)
    throw new ReviewError("Account access is temporarily unavailable.");
  if (!profile || profile.deactivated_at || (adminOnly && !profile.is_admin))
    throw new ReviewError("Access denied.", 403);
  return { id: user.id, isAdmin: !!profile.is_admin };
}
export async function reviewContext(userId: string): Promise<ReviewContext> {
  const db = createAdminClient();
  const [review, invoice, agreement] = await Promise.all([
    db.from("customer_reviews").select("*").eq("user_id", userId).maybeSingle(),
    db
      .from("invoice_analyses")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("agreement_analyses")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (review.error || invoice.error || agreement.error)
    throw new ReviewError(
      "Could not load your review eligibility. Please try again.",
    );
  return {
    review: review.data as CustomerReview | null,
    analysis: invoice.data
      ? { id: invoice.data.id, kind: "invoice" }
      : agreement.data
        ? { id: agreement.data.id, kind: "agreement" }
        : null,
  };
}
const publicColumns =
  "id,rating,body,display_name,business_name,role,created_at";
export async function publishedReviews(
  featured = false,
  offset = 0,
): Promise<{ reviews: PublicReview[]; total: number }> {
  const db = createAdminClient();
  let query = db
    .from("customer_reviews")
    .select(publicColumns, { count: "exact" })
    .eq("status", "published")
    .eq("publication_consent", true);
  if (featured) query = query.eq("featured", true).gte("rating", 4);
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id")
    .range(offset, offset + (featured ? 2 : 19));
  if (error) throw new ReviewError("Reviews are temporarily unavailable.");
  return { reviews: (data ?? []).map(publicReview), total: count ?? 0 };
}
export async function reviewStats() {
  // Range in batches so the aggregate includes every published rating, beyond PostgREST's row cap.
  const db = createAdminClient();
  let total = 0,
    sum = 0;
  const distribution = [0, 0, 0, 0, 0];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db
      .from("customer_reviews")
      .select("rating")
      .eq("status", "published")
      .eq("publication_consent", true)
      .order("id")
      .range(offset, offset + 499);
    if (error)
      throw new ReviewError("Review summary is temporarily unavailable.");
    for (const r of data ?? []) {
      total++;
      sum += r.rating;
      distribution[r.rating - 1]++;
    }
    if ((data?.length ?? 0) < 500) break;
  }
  return { total, average: total ? sum / total : null, distribution };
}

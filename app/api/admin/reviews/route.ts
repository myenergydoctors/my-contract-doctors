import { createAdminClient } from "@/lib/supabase/admin";
import {
  canFeatureReview,
  isUuid,
  moderationReasons,
  type CustomerReview,
  type ModerationReason,
} from "@/lib/reviews/domain";
import { reviewIdentity, ReviewError } from "@/lib/reviews/server";
import {
  checkReviewOrigin,
  reviewFailure,
  reviewJson,
  reviewResponse,
} from "@/lib/reviews/http";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    await reviewIdentity(true);
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const status = url.searchParams.get("status") || "pending";
    if (
      !["pending", "published", "rejected", "withdrawn", "private"].includes(
        status,
      ) ||
      !Number.isSafeInteger(page)
    )
      throw new ReviewError("Invalid filter.", 400);
    let query = createAdminClient()
      .from("customer_reviews")
      .select("*", { count: "exact" });
    query =
      status === "private"
        ? query.eq("publication_consent", false)
        : query.eq("status", status);
    const { data, error, count } = await query
      .order("created_at", { ascending: true })
      .order("id")
      .range((page - 1) * 20, page * 20 - 1);
    if (error) throw new ReviewError("Could not load the moderation queue.");
    return reviewResponse({ reviews: data, total: count ?? 0 });
  } catch (error) {
    return reviewFailure(error);
  }
}
export async function PATCH(req: Request) {
  try {
    checkReviewOrigin(req);
    const user = await reviewIdentity(true);
    const body = (await reviewJson(req)) as Record<string, unknown>;
    if (
      !body ||
      !isUuid(body.id) ||
      !["published", "rejected", "pending"].includes(String(body.status)) ||
      typeof body.featured !== "boolean" ||
      typeof body.updatedAt !== "string"
    )
      throw new ReviewError("Invalid moderation request.", 400);
    const reason = body.reason as ModerationReason | null;
    if (
      body.status === "rejected" &&
      (!reason || !Object.hasOwn(moderationReasons, reason))
    )
      throw new ReviewError(
        "Choose a content-policy reason. Ratings are not a rejection reason.",
        400,
      );
    const db = createAdminClient();
    const { data, error } = await db
      .from("customer_reviews")
      .select("*")
      .eq("id", body.id)
      .maybeSingle();
    if (error) throw new ReviewError("Could not load the review.");
    if (!data) throw new ReviewError("Review not found.", 404);
    const review = data as CustomerReview;
    if (!review.publication_consent || review.status === "withdrawn")
      throw new ReviewError(
        "This customer has not authorized publication.",
        409,
      );
    if (
      body.featured &&
      !canFeatureReview({ ...review, status: String(body.status) })
    )
      throw new ReviewError(
        "Only published 4- or 5-star reviews can be featured.",
        400,
      );
    const { data: updated, error: updateError } = await db
      .from("customer_reviews")
      .update({
        status: body.status,
        featured: body.status === "published" ? body.featured : false,
        moderation_reason: body.status === "rejected" ? reason : null,
        last_actor_id: user.id,
      })
      .eq("id", review.id)
      .eq("updated_at", body.updatedAt)
      .eq("publication_consent", true)
      .select("id")
      .maybeSingle();
    if (updateError) throw new ReviewError("Could not save moderation.");
    if (!updated)
      throw new ReviewError(
        "This review changed. Refresh the queue before trying again.",
        409,
      );
    return reviewResponse({ ok: true });
  } catch (error) {
    return reviewFailure(error);
  }
}

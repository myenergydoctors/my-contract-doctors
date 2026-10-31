import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REVIEW_CONSENT_VERSION, parseReviewInput } from "@/lib/reviews/domain";
import {
  reviewContext,
  reviewIdentity,
  ReviewError,
} from "@/lib/reviews/server";
import {
  checkReviewOrigin,
  reviewFailure,
  reviewJson,
  reviewResponse,
} from "@/lib/reviews/http";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await reviewIdentity();
    return reviewResponse(await reviewContext(user.id));
  } catch (error) {
    return reviewFailure(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    checkReviewOrigin(req);
    const user = await reviewIdentity();
    const limit = await checkRateLimit(req, {
      namespace: "review-submit",
      identity: user.id,
      maxRequests: 10,
      windowSeconds: 3600,
    });
    if (!limit.allowed) return rateLimitResponse(limit);
    const body = await reviewJson(req);
    let input;
    try {
      input = parseReviewInput(body);
    } catch (error) {
      throw new ReviewError(
        error instanceof Error ? error.message : "Invalid review.",
        400,
      );
    }
    const db = createAdminClient();
    const { data: analysis, error: sourceError } = await db
      .from(
        input.analysisKind === "invoice"
          ? "invoice_analyses"
          : "agreement_analyses",
      )
      .select("id")
      .eq("id", input.analysisId)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .maybeSingle();
    if (sourceError) throw new ReviewError("Could not verify your analysis.");
    if (!analysis)
      throw new ReviewError(
        "A completed analysis belonging to your account is required.",
        403,
      );
    const { error } = await db
      .from("customer_reviews")
      .insert({
        user_id: user.id,
        last_actor_id: user.id,
        invoice_id: input.analysisKind === "invoice" ? input.analysisId : null,
        agreement_id:
          input.analysisKind === "agreement" ? input.analysisId : null,
        rating: input.rating,
        body: input.body,
        display_name: input.displayName,
        business_name: input.businessName,
        role: input.role,
        publication_consent: input.publicationConsent,
        consented_at: input.publicationConsent
          ? new Date().toISOString()
          : null,
        consent_version: REVIEW_CONSENT_VERSION,
      });
    if (error?.code === "23505")
      throw new ReviewError(
        "You have already submitted a review. One review is allowed per account.",
        409,
      );
    if (error)
      throw new ReviewError("Could not save your review. Please try again.");
    return reviewResponse(await reviewContext(user.id), 201);
  } catch (error) {
    return reviewFailure(error);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    checkReviewOrigin(req);
    const user = await reviewIdentity();
    const { error } = await createAdminClient()
      .from("customer_reviews")
      .update({
        publication_consent: false,
        consent_withdrawn_at: new Date().toISOString(),
        status: "withdrawn",
        featured: false,
        last_actor_id: user.id,
      })
      .eq("user_id", user.id)
      .eq("publication_consent", true);
    if (error)
      throw new ReviewError("Could not withdraw publication permission.");
    return reviewResponse(await reviewContext(user.id));
  } catch (error) {
    return reviewFailure(error);
  }
}

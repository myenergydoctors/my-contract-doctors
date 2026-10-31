export const REVIEW_CONSENT_VERSION = "reviews-v1";
export const moderationReasons = {
  spam: "Spam or advertising",
  personal_information: "Contains personal or confidential information",
  abuse: "Abusive or threatening content",
  unrelated: "Unrelated to the product experience",
  not_genuine: "Not a genuine customer experience",
} as const;
export type ModerationReason = keyof typeof moderationReasons;
export type ReviewStatus = "pending" | "published" | "rejected" | "withdrawn";
export type PublicReview = {
  id: string;
  rating: number;
  body: string;
  display_name: string;
  business_name: string | null;
  role: string | null;
  created_at: string;
};
export type CustomerReview = PublicReview & {
  user_id: string;
  invoice_id: string | null;
  agreement_id: string | null;
  publication_consent: boolean;
  consent_version: string;
  consented_at: string | null;
  consent_withdrawn_at: string | null;
  status: ReviewStatus;
  featured: boolean;
  moderation_reason: ModerationReason | null;
  updated_at: string;
};
export type ReviewInput = {
  analysisKind: "invoice" | "agreement";
  analysisId: string;
  rating: number;
  body: string;
  displayName: string;
  businessName: string | null;
  role: string | null;
  publicationConsent: boolean;
};
export type ReviewContext = {
  review: CustomerReview | null;
  analysis: { id: string; kind: "invoice" | "agreement" } | null;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuid.test(value);
}
export function parseReviewInput(value: unknown): ReviewInput {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid review.");
  const v = value as Record<string, unknown>;
  if (
    !isUuid(v.analysisId) ||
    !["invoice", "agreement"].includes(String(v.analysisKind))
  )
    throw new Error("Choose a completed analysis.");
  if (
    typeof v.rating !== "number" ||
    !Number.isInteger(v.rating) ||
    v.rating < 1 ||
    v.rating > 5
  )
    throw new Error("Choose a rating from 1 to 5.");
  function text(key: string, min: number, max: number): string {
    if (typeof v[key] !== "string") throw new Error(`Invalid ${key}.`);
    const s = (v[key] as string).trim();
    if (
      [...s].length < min ||
      [...s].length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s)
    )
      throw new Error(`${key} must contain ${min}-${max} characters.`);
    return s;
  }
  if (typeof v.publicationConsent !== "boolean")
    throw new Error("Choose whether to allow publication.");
  return {
    analysisKind: v.analysisKind as ReviewInput["analysisKind"],
    analysisId: v.analysisId,
    rating: v.rating,
    body: text("body", 20, 2000),
    displayName: text("displayName", 1, 80),
    businessName:
      v.businessName == null || v.businessName === ""
        ? null
        : text("businessName", 1, 120),
    role: v.role == null || v.role === "" ? null : text("role", 1, 80),
    publicationConsent: v.publicationConsent,
  };
}
export function canFeatureReview(r: {
  rating: number;
  status: string;
  publication_consent: boolean;
}): boolean {
  return r.rating >= 4 && r.status === "published" && r.publication_consent;
}
export function publicReview(r: PublicReview): PublicReview {
  return {
    id: r.id,
    rating: r.rating,
    body: r.body,
    display_name: r.display_name,
    business_name: r.business_name,
    role: r.role,
    created_at: r.created_at,
  };
}

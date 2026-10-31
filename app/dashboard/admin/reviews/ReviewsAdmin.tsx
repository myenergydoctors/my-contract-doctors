"use client";
import { useCallback, useEffect, useState } from "react";
import {
  moderationReasons,
  type CustomerReview,
  type ModerationReason,
} from "@/lib/reviews/domain";
import ReviewCard from "@/components/reviews/ReviewCard";
function ModerationCard({
  review,
  onSaved,
}: {
  review: CustomerReview;
  onSaved: () => Promise<void>;
}) {
  const [reason, setReason] = useState<ModerationReason | "">(
    review.moderation_reason || "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(status: string, featured = false) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: review.id,
          status,
          featured,
          reason: reason || null,
          updatedAt: review.updated_at,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save.");
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6">
      <ReviewCard review={review} />
      <div className="mt-4 font-sans text-xs leading-6 text-gray-500">
        <p>
          Status: <b className="text-navy">{review.status}</b> ·{" "}
          {review.publication_consent
            ? "Publication authorized"
            : "Private feedback - no publication permission"}
          {review.featured ? " · Featured on homepage" : ""}
        </p>
        <p>
          Verified against completed{" "}
          {review.invoice_id ? "invoice" : "agreement"} analysis · Consent:{" "}
          {review.consent_version}
          {review.consented_at
            ? ` on ${new Date(review.consented_at).toLocaleDateString("en-US")}`
            : " (not granted)"}
        </p>
      </div>
      {review.publication_consent && review.status !== "withdrawn" && (
        <fieldset disabled={busy} className="mt-5 space-y-4">
          <legend className="sr-only">
            Moderation actions for review by {review.display_name}
          </legend>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => save("published", review.featured)}
              className="rounded-lg bg-navy px-4 py-2 text-sm text-white"
            >
              {busy
                ? "Saving…"
                : review.status === "published"
                  ? "Keep published"
                  : "Publish review"}
            </button>
            {review.status === "published" && review.rating >= 4 && (
              <button
                type="button"
                onClick={() => save("published", !review.featured)}
                className="rounded-lg border border-teal px-4 py-2 text-sm text-navy"
              >
                {review.featured
                  ? "Remove from homepage"
                  : "Feature on homepage"}
              </button>
            )}
            {review.status !== "pending" && (
              <button
                type="button"
                onClick={() => save("pending")}
                className="px-3 py-2 text-sm text-blue underline"
              >
                Return to pending
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1 font-sans text-xs text-gray-500">
              Content-policy reason
              <select
                aria-label={`Content-policy reason for ${review.display_name}`}
                value={reason}
                onChange={(e) => setReason(e.target.value as ModerationReason)}
                className="mt-2 block w-full max-w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-navy"
              >
                <option value="">Choose a reason</option>
                {Object.entries(moderationReasons).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!reason}
              onClick={() => save("rejected")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-40"
            >
              Reject for this reason
            </button>
          </div>
        </fieldset>
      )}
      {error && (
        <p role="alert" className="mt-3 font-sans text-sm text-red">
          {error}
        </p>
      )}
    </article>
  );
}
export default function ReviewsAdmin() {
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/admin/reviews?status=${filter}&page=${page}`,
          { cache: "no-store", signal },
        );
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Could not load reviews.");
        setReviews(result.reviews);
        setTotal(result.total);
      } catch (e) {
        if (signal?.aborted) return;
        setError(e instanceof Error ? e.message : "Could not load reviews.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [filter, page],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  return (
    <div className="max-w-5xl">
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-teal">
        Customer voice
      </p>
      <h1 className="mt-2 font-serif text-3xl text-navy">Review moderation</h1>
      <p className="mt-3 max-w-3xl font-sans text-sm leading-7 text-gray-500">
        Review oldest submissions first. Apply the same content policy to every
        rating. Publish genuine negative feedback too. Feature only
        permissioned, published 4- and 5-star reviews; up to three of the most
        recent selected reviews appear on the homepage. Never reject a review
        because of its rating.
      </p>
      <div className="my-6 flex flex-wrap items-center gap-4">
        <label className="font-sans text-sm text-navy">
          Show
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="ml-3 rounded-lg border border-gray-300 bg-white px-4 py-2"
          >
            {["pending", "published", "rejected", "withdrawn", "private"].map(
              (x) => (
                <option key={x} value={x}>
                  {x === "private"
                    ? "Private feedback"
                    : x.charAt(0).toUpperCase() + x.slice(1)}
                </option>
              ),
            )}
          </select>
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => void load()}
          className="text-sm text-blue underline"
        >
          Refresh
        </button>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-white p-6 text-red">
          {error}
        </p>
      ) : loading ? (
        <p role="status" className="p-6 text-gray-500">
          Loading reviews…
        </p>
      ) : (
        <>
          <p role="status" className="mb-4 font-sans text-sm text-gray-500">
            {total} {total === 1 ? "review" : "reviews"} in this view
          </p>
          <div className="space-y-5">
            {reviews.map((review) => (
              <ModerationCard
                key={`${review.id}:${review.updated_at}`}
                review={review}
                onSaved={() => load()}
              />
            ))}
            {!reviews.length && (
              <p className="rounded-xl border border-gray-200 bg-white p-8 font-sans text-gray-500">
                No reviews in this view.
              </p>
            )}
          </div>
          <nav
            aria-label="Moderation pages"
            className="mt-6 flex items-center gap-5"
          >
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-sm text-blue disabled:text-gray-300"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500">Page {page}</span>
            <button
              type="button"
              disabled={page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="text-sm text-blue disabled:text-gray-300"
            >
              Next →
            </button>
          </nav>
        </>
      )}
    </div>
  );
}

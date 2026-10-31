import type { PublicReview } from "@/lib/reviews/domain";
export function ReviewStars({ rating }: { rating: number }) {
  return (
    <span
      aria-label={`${rating} out of 5 stars`}
      className="text-amber tracking-[0.12em]"
    >
      <span aria-hidden="true">
        {"★".repeat(rating)}
        <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
      </span>
    </span>
  );
}
export default function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReviewStars rating={review.rating} />
        <span className="rounded-full bg-teal-light px-3 py-1 font-sans text-xs text-navy">
          Verified analysis user
        </span>
      </div>
      <blockquote className="my-5 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-gray-700">
        {review.body}
      </blockquote>
      <footer className="mt-auto border-t border-gray-100 pt-4 font-sans text-sm">
        <p className="break-words font-semibold text-navy">{review.display_name}</p>
        {(review.role || review.business_name) && (
          <p className="mt-1 break-words text-gray-500">
            {[review.role, review.business_name].filter(Boolean).join(" · ")}
          </p>
        )}
        <time
          className="mt-2 block text-xs text-gray-500"
          dateTime={review.created_at}
        >
          {new Date(review.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}
        </time>
      </footer>
    </article>
  );
}

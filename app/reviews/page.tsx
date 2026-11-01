import { BrandHero } from "@/components/marketing/BrandSections";
import brand from "@/components/marketing/BrandSections.module.css";
import Link from "next/link";
import { connection } from "next/server";
import ReviewCard from "@/components/reviews/ReviewCard";
import { publishedReviews, reviewStats } from "@/lib/reviews/server";
export const metadata = {
  title: "Customer reviews",
  description:
    "Honest feedback from verified My Contract Doctors analysis users. Read every published rating, from one to five stars.",
  alternates: { canonical: "/reviews" },
};
export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(100000, Math.floor(Number(params.page) || 1)),
  );
  let result:
    | [
        Awaited<ReturnType<typeof publishedReviews>>,
        Awaited<ReturnType<typeof reviewStats>>,
      ]
    | null = null;
  try {
    result = await Promise.all([
      publishedReviews(false, (page - 1) * 20),
      reviewStats(),
    ]);
  } catch (error) {
    console.error(
      "Public reviews unavailable",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
  const [{ reviews, total }, stats] = result ?? [
    { reviews: [], total: 0 },
    { total: 0, average: null, distribution: [0, 0, 0, 0, 0] },
  ];
  const content = result ? (
    <>
      <section
        aria-label="Rating summary"
        className="mb-8 grid gap-8 rounded-2xl border border-gray-200 bg-white p-7 md:grid-cols-2 md:p-9"
      >
        <div>
          <p className="font-serif text-5xl text-navy">
            {stats.average === null
              ? "No ratings yet"
              : `${stats.average.toFixed(1)} / 5`}
          </p>
          <p className="mt-3 font-sans text-sm text-gray-500">
            {stats.total} published {stats.total === 1 ? "review" : "reviews"}.
            Every published rating is included.
          </p>
        </div>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div
              key={star}
              className="flex items-center gap-3 font-sans text-xs text-gray-500"
            >
              <span className="w-12">{star} stars</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-teal"
                  style={{
                    width: `${stats.total ? (stats.distribution[star - 1] / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="w-7 text-right">
                {stats.distribution[star - 1]}
              </span>
            </div>
          ))}
        </div>
      </section>
      {!reviews.length ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <h2 className="font-serif text-2xl text-navy">
            {total
              ? "No reviews on this page"
              : "Be one of the first to share your experience."}
          </h2>
          <p className="mt-3 font-sans text-sm text-gray-500">
            {total
              ? "Return to the first page to read published feedback."
              : "After completing an analysis, you can leave an honest review from your dashboard."}
          </p>
          {total > 0 && (
            <Link
              href="/reviews"
              className="mt-4 inline-block text-blue underline"
            >
              First page
            </Link>
          )}
        </div>
      ) : (
        <div className="grid items-start gap-5 md:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
      {(page > 1 || page * 20 < total) && (
        <nav
          aria-label="Review pages"
          className="mt-8 flex items-center justify-between font-sans text-sm"
        >
          {page > 1 ? (
            <Link
              className="text-blue underline"
              href={`/reviews?page=${page - 1}`}
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span>Page {page}</span>
          {page * 20 < total ? (
            <Link
              className="text-blue underline"
              href={`/reviews?page=${page + 1}`}
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  ) : (
    <div
      role="status"
      className="rounded-2xl border border-gray-200 bg-white p-8 font-sans text-gray-700"
    >
      Reviews are temporarily unavailable. Please try again shortly.
    </div>
  );
  return (
    <main className={brand.page}>
      <BrandHero
        eyebrow="Verified use. Honest feedback."
        title={
          <>
            Real experiences.
            <br />
            <em>In their own words.</em>
          </>
        }
        description="Reviews come from signed-in customers with a completed invoice or agreement analysis, including free analyses. We verify product use, not claims of savings. We publish all ratings that meet our content policy and have the reviewer’s permission."
        image="bakery"
        caption="The service items behind the stories."
        actions={
          <Link href="/dashboard/reviews" className={brand.primary}>
            Share your experience ↗
          </Link>
        }
      />
      <div className={brand.reviewBody}>
        {content}
        <section className="mt-10 border-t border-gray-200 pt-7">
          <h2 className="font-serif text-2xl text-navy">
            How reviews are published
          </h2>
          <p className="mt-3 font-sans text-sm leading-7 text-gray-500">
            Every review follows the same moderation process, regardless of
            rating. We check for spam, personal or confidential information,
            abuse, unrelated content, and authenticity. Negative sentiment is
            not a reason to reject a review. Private feedback is not published
            or included in ratings. Customers can withdraw publication
            permission from their dashboard. Homepage testimonials are a
            selected subset of positive reviews, rather than the complete set.
          </p>
        </section>
      </div>
    </main>
  );
}

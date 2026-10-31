import Link from "next/link";
import { connection } from "next/server";
import { publishedReviews } from "@/lib/reviews/server";
import ReviewCard from "./ReviewCard";
export default async function FeaturedReviews() {
  await connection();
  let reviews;
  try {
    ({ reviews } = await publishedReviews(true));
  } catch (error) {
    console.error(
      "Featured reviews unavailable",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
  if (!reviews.length) return null;
  return (
    <section
      className="bg-off-white px-6 py-16 md:px-8 md:py-24"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-[1180px]">
        <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-teal">
          From our customers
        </p>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2
              id="testimonials-heading"
              className="font-serif text-3xl text-navy md:text-4xl"
            >
              Selected customer testimonials
            </h2>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-gray-500">
              A selection of positive experiences. Read all published ratings
              and feedback on our reviews page.
            </p>
          </div>
          <Link
            href="/reviews"
            className="font-sans text-sm font-semibold text-blue underline underline-offset-4"
          >
            Read all reviews →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}

import { redirect } from "next/navigation";
import {
  reviewContext,
  reviewIdentity,
  ReviewError,
} from "@/lib/reviews/server";
import ReviewForm from "./ReviewForm";
export const metadata = {
  title: "Your review | My Contract Doctors",
  robots: { index: false, follow: false },
};
export default async function YourReviewPage() {
  let identity;
  try {
    identity = await reviewIdentity();
  } catch (error) {
    if (error instanceof ReviewError && error.status === 401)
      redirect("/sign-in?redirect=/dashboard/reviews");
    throw error;
  }
  let context = null;
  try {
    context = await reviewContext(identity.id);
  } catch {}
  const content = context ? (
    <ReviewForm initial={context} />
  ) : (
    <p
      role="alert"
      className="rounded-xl border border-gray-200 bg-white p-6 font-sans text-gray-700"
    >
      We could not load your review right now. Please refresh to try again.
    </p>
  );
  return (
    <div className="max-w-3xl">
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-teal">
        Your voice matters
      </p>
      <h1 className="mt-2 font-serif text-3xl text-navy">
        Share your experience
      </h1>
      <p className="mb-7 mt-3 font-sans text-sm leading-7 text-gray-500">
        Help other business owners know what to expect, and help us improve.
      </p>
      {content}
    </div>
  );
}

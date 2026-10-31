"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ReviewStars } from "@/components/reviews/ReviewCard";
import type { ReviewContext } from "@/lib/reviews/domain";
const inputClass =
  "mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 font-sans text-sm text-navy focus:outline-2 focus:outline-offset-2 focus:outline-blue";
export default function ReviewForm({ initial }: { initial: ReviewContext }) {
  const [context, setContext] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [consent, setConsent] = useState(false);
  const [withdraw, setWithdraw] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reviews/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisKind: context.analysis?.kind,
          analysisId: context.analysis?.id,
          rating,
          body: data.get("body"),
          displayName: data.get("displayName"),
          businessName: data.get("businessName"),
          role: data.get("role"),
          publicationConsent: consent,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not save your review.");
      setContext(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your review.");
    } finally {
      setBusy(false);
    }
  }
  async function withdrawConsent() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reviews/me", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not withdraw permission.");
      setContext(result);
      setWithdraw(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (context.review) {
    const r = context.review;
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-teal">
          Your feedback is saved
        </p>
        <h2 className="mt-2 font-serif text-2xl text-navy">
          Thank you for sharing your experience.
        </h2>
        <div className="my-5">
          <ReviewStars rating={r.rating} />
          <p className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-gray-700">
            {r.body}
          </p>
        </div>
        <p className="font-sans text-sm text-gray-500">
          {!r.publication_consent
            ? "Your feedback is private and will not appear publicly."
            : r.status === "pending"
              ? "Your review is awaiting moderation. All ratings follow the same process."
              : r.status === "published"
                ? "Your review is published. Your rating is included in the overall score."
                : "Your review was not published because of our content policy. Contact us if you have a question."}
        </p>
        {r.publication_consent && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            {!withdraw ? (
              <button
                type="button"
                onClick={() => setWithdraw(true)}
                className="font-sans text-sm text-blue underline"
              >
                Withdraw publication permission
              </button>
            ) : (
              <>
                <p className="mb-3 font-sans text-sm text-gray-700">
                  Remove your review from our public reviews and homepage? We
                  will keep your feedback privately.
                </p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={withdrawConsent}
                    className="rounded-lg bg-navy px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {busy ? "Removing…" : "Withdraw permission"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setWithdraw(false)}
                    className="text-sm text-gray-500 underline"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red">
            {error}
          </p>
        )}
        <Link
          className="mt-6 inline-block font-sans text-sm text-blue underline"
          href="/reviews"
        >
          Read customer reviews
        </Link>
      </section>
    );
  }
  if (!context.analysis)
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-8">
        <h2 className="font-serif text-2xl text-navy">
          Try an analysis first.
        </h2>
        <p className="mt-3 font-sans text-sm leading-7 text-gray-500">
          Reviews are available after a completed invoice or agreement analysis.
          Free analyses qualify too. Demo previews do not qualify.
        </p>
        <Link
          href="/invoice"
          className="mt-5 inline-block rounded-lg bg-navy px-5 py-3 text-sm text-white"
        >
          Analyze an invoice
        </Link>
      </section>
    );
  return (
    <form
      onSubmit={submit}
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 md:p-8"
    >
      <div className="rounded-xl bg-teal-light p-4 font-sans text-sm leading-6 text-navy">
        Your completed {context.analysis.kind} analysis verifies your
        experience. One review per account. Positive, negative, or somewhere in
        between: we welcome your honest feedback.
      </div>
      <fieldset>
        <legend className="font-sans text-sm font-semibold text-navy">
          How was your experience?{" "}
          <span className="font-normal text-gray-500">(required)</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <label
              key={star}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm ${rating === star ? "border-blue bg-blue-pale text-navy" : "border-gray-200 text-gray-500"}`}
            >
              <input
                type="radio"
                required
                name="rating"
                value={star}
                checked={rating === star}
                onChange={() => setRating(star)}
                className="accent-blue"
              />
              {star} <span aria-hidden="true">★</span>
              <span className="sr-only">{star === 1 ? "star" : "stars"}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label
        className="block font-sans text-sm font-semibold text-navy"
        htmlFor="review-body"
      >
        Your review{" "}
        <span className="font-normal text-gray-500">(required)</span>
        <textarea
          id="review-body"
          name="body"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          className={inputClass}
          aria-describedby="review-body-help"
        />
        <span
          id="review-body-help"
          className="mt-2 block text-xs font-normal leading-5 text-gray-500"
        >
          20-2,000 characters. What helped, or what could be better? Do not
          include account numbers, invoice details, or other confidential
          information.
        </span>
      </label>
      <label
        className="block font-sans text-sm font-semibold text-navy"
        htmlFor="review-name"
      >
        Display name{" "}
        <span className="font-normal text-gray-500">(required)</span>
        <input
          id="review-name"
          name="displayName"
          required
          maxLength={80}
          placeholder="e.g. Alex R."
          className={inputClass}
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label htmlFor="review-role" className="font-sans text-sm text-navy">
          Role (optional)
          <input
            id="review-role"
            name="role"
            maxLength={80}
            placeholder="e.g. Owner"
            className={inputClass}
          />
        </label>
        <label
          htmlFor="review-business"
          className="font-sans text-sm text-navy"
        >
          Business (optional)
          <input
            id="review-business"
            name="businessName"
            maxLength={120}
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex items-start gap-3 rounded-xl bg-off-white p-4 font-sans text-sm leading-6 text-gray-700">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-blue"
        />
        <span>
          I allow My Contract Doctors to publish my rating, review, and chosen
          display name, role, and business on its website, including selected
          testimonials. My email and uploaded documents will not be published. I
          can withdraw permission from this page.
        </span>
      </label>
      <p className="font-sans text-xs leading-6 text-gray-500">
        Leave the box unchecked to send private feedback only. Publication
        permission is optional and does not affect your service or access.
      </p>
      {error && (
        <p role="alert" className="font-sans text-sm text-red">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        type="submit"
        className="rounded-lg bg-navy px-6 py-3 font-sans text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy
          ? "Saving…"
          : consent
            ? "Submit review for moderation"
            : "Send private feedback"}
      </button>
    </form>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function ReviewPrompt() {
  const [eligible, setEligible] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/reviews/me", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        setEligible(!!result.analysis && !result.review);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  if (!eligible) return null;
  return (
    <aside className="mb-8 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-teal/25 bg-teal-light p-6">
      <div>
        <h2 className="font-serif text-xl text-navy">How was your analysis?</h2>
        <p className="mt-1 font-sans text-sm text-gray-700">
          Share an honest review. Every rating helps us improve.
        </p>
      </div>
      <Link
        href="/dashboard/reviews"
        className="rounded-lg bg-navy px-5 py-3 font-sans text-sm text-white"
      >
        Leave a review
      </Link>
    </aside>
  );
}

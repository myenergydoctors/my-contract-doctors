import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviewIdentity, ReviewError } from "@/lib/reviews/server";
export const metadata = {
  title: "Annual offer email capture",
  robots: { index: false, follow: false },
};
export default async function AnnualOffersAdmin({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  try {
    await reviewIdentity(true);
  } catch (error) {
    if (error instanceof ReviewError && error.status === 401)
      redirect("/sign-in?redirect=/dashboard/admin/annual-offers");
    if (error instanceof ReviewError && error.status === 403)
      redirect("/dashboard");
    throw error;
  }
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(100000, Math.floor(Number(params.page) || 1)),
  );
  const { data, error, count } = await createAdminClient()
    .from("annual_offer_claims")
    .select("id,email,source,status,created_at,user_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  return (
    <div className="max-w-5xl">
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-teal">
        Email capture
      </p>
      <h1 className="mt-2 font-serif text-3xl text-navy">
        Annual membership offers
      </h1>
      <p className="mb-7 mt-3 max-w-3xl font-sans text-sm leading-7 text-gray-500">
        Emails saved for the one-time 30% first-annual-term offer. These
        contacts have requested this offer only; they have not opted into a
        newsletter. A saved preview is not a paid conversion or redemption.
      </p>
      {error ? (
        <p role="alert">Could not load saved offers. Please refresh.</p>
      ) : (
        <>
          <p className="mb-4 font-sans text-sm text-gray-500">
            {count ?? 0} saved offers
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left font-sans text-sm">
              <caption className="sr-only">
                Captured annual membership offers, newest first
              </caption>
              <thead className="bg-off-white text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  {["Email", "Source", "Status", "Account", "Saved"].map(
                    (label) => (
                      <th key={label} scope="col" className="px-5 py-4">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data?.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="px-5 py-4 text-navy">{row.email}</td>
                    <td className="px-5 py-4">{row.source}</td>
                    <td className="px-5 py-4">{row.status}</td>
                    <td className="px-5 py-4">
                      {row.user_id ? "Verified account" : "Not linked"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {new Date(row.created_at).toLocaleDateString("en-US", {
                        timeZone: "UTC",
                      })}
                    </td>
                  </tr>
                ))}
                {!data?.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      No offers saved yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <nav
            aria-label="Offer pages"
            className="mt-5 flex items-center justify-between text-sm"
          >
            {page > 1 ? (
              <Link href={`?page=${page - 1}`} className="text-blue underline">
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span>Page {page}</span>
            {page * 20 < (count ?? 0) ? (
              <Link href={`?page=${page + 1}`} className="text-blue underline">
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </>
      )}
    </div>
  );
}

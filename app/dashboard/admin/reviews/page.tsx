import { redirect } from "next/navigation";
import { reviewIdentity, ReviewError } from "@/lib/reviews/server";
import ReviewsAdmin from "./ReviewsAdmin";
export const metadata = {
  title: "Review moderation | My Contract Doctors",
  robots: { index: false, follow: false },
};
export default async function ReviewsAdminPage() {
  try {
    await reviewIdentity(true);
  } catch (error) {
    if (error instanceof ReviewError && error.status === 401)
      redirect("/sign-in?redirect=/dashboard/admin/reviews");
    if (error instanceof ReviewError && error.status === 403)
      redirect("/dashboard");
    throw error;
  }
  return <ReviewsAdmin />;
}

import { Suspense } from "react";
import HomeContent from "@/components/marketing/HomeContent";
import FeaturedReviews from "@/components/reviews/FeaturedReviews";

export default function HomePage() {
  return (
    <HomeContent
      testimonials={
        <Suspense fallback={null}>
          <FeaturedReviews />
        </Suspense>
      }
    />
  );
}

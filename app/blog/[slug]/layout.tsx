import type { ReactNode } from "react";
import { posts } from "@/lib/posts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((post) => post.slug === slug);
  return {
    title: post?.title ?? "Article not found",
    description: post?.excerpt,
  };
}

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Help center" };

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import CookieBanner from "@/components/CookieBanner";
import StickyCtaBar from "@/components/marketing/StickyCtaBar";
import ExitIntentPopup from "@/components/marketing/ExitIntentPopup";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  keywords: [
    "uniform contract review",
    "linen service contract",
    "uniform invoice audit",
    "contract negotiation",
    "Cintas contract help",
    "UniFirst contract review",
    "vendor invoice analysis",
    "service contract savings",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: SITE.url },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <OrganizationSchema />
        <Nav />
        <StickyCtaBar />
        {children}
        <Footer />
        <ChatWidget />
        <ExitIntentPopup />
        <CookieBanner />
      </body>
    </html>
  );
}

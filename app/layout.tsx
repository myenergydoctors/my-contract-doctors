import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "My Contract Doctors | Demystify Your Uniform Contract",
  description: "Upload your uniform or linen service agreement and invoice. We analyze every clause and line item to show you exactly where you're overpaying — and how to fix it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#F7F9FC" }}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
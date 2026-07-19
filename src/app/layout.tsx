import type { Metadata } from "next";
import { Figtree, Inter } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });

// No em dashes in shipped copy, titles included: the product promises it, so the
// site keeps to it.
export const metadata: Metadata = {
  metadataBase: new URL("https://mavrix.agency"),
  title: "Wire: the content engine for CMOs",
  description: "Research-first content: live SEO intelligence, a brand-trained writer, and every channel format. Built for Series A/B marketing teams.",
  // Only site-wide defaults belong here. Anything page-specific (canonical URL,
  // per-page OG title) is set on the page, or every route inherits the homepage's.
  openGraph: { type: "website", siteName: "Wire" },
  twitter: { card: "summary_large_image" },
};

/**
 * ClerkProvider deliberately does not live here. It wraps the (app) route group
 * instead, so the marketing homepage and the legal pages ship no Clerk
 * JavaScript: they are public and have nothing to authenticate.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

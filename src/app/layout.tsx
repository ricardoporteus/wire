import type { Metadata } from "next";
import { Figtree, Inter, IBM_Plex_Mono } from "next/font/google";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

// Analytics IDs are public by nature — they appear in every visitor's page
// source — so a literal default is fine in this public repo, and an env var can
// override per environment. GA4 pageviews are sent DIRECTLY via GoogleAnalytics;
// the GTM container is only for other tags. Do not also add a GA4 tag for this
// same property inside GTM, or pageviews double-count.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-KRT5JKL9";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-RGQCCFZZG5";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["500"] });

// No em dashes in shipped copy, titles included: the product promises it, so the
// site keeps to it.
export const metadata: Metadata = {
  metadataBase: new URL("https://mavrix.agency"),
  title: "Mavrix: your AI marketing team",
  description: "A four-person AI marketing team that researches your market, wins the rankings, protects your brand and writes the content. Get found on Google, get quoted by AI.",
  // Only site-wide defaults belong here. Anything page-specific (canonical URL,
  // per-page OG title) is set on the page, or every route inherits the homepage's.
  openGraph: { type: "website", siteName: "Mavrix" },
  twitter: { card: "summary_large_image" },
};

/**
 * ClerkProvider deliberately does not live here. It wraps the (app) route group
 * instead, so the marketing homepage and the legal pages ship no Clerk
 * JavaScript: they are public and have nothing to authenticate.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${inter.variable} ${plexMono.variable}`}>
      {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
      <body>{children}</body>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}

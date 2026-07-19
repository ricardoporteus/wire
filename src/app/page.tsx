/**
 * Marketing homepage, served on the apex domain.
 *
 * Deliberately free of request-time data: no headers(), no auth(), no database.
 * That lets Next prerender it as static HTML, so the CDN can cache it and the
 * browser can put it in the back/forward cache. Reading the host here previously
 * forced dynamic rendering and stamped `cache-control: no-store` on the page.
 *
 * Host routing therefore lives in middleware: a request for "/" on the app host
 * is redirected to /dashboard before it ever reaches this file.
 *
 * Copy lives in ./_home/content.ts. The previous homepage is parked at
 * /spare-home.
 */
import type { Metadata } from "next";
import { HomePage } from "./_home/HomePage";

const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST;
/** Absolute when the app lives on its own host; relative in local dev. */
const APP = APP_HOST ? `https://${APP_HOST}` : "";

export const metadata: Metadata = {
  title: "Wire: the content engine for CMOs",
  description:
    "Wire learns your brand, sweeps your market for what is worth writing, then drafts it in your voice and reshapes it for every channel.",
  openGraph: {
    title: "Wire: the content engine for CMOs",
    description:
      "Research first, then writing. Six live research stages, a brand-trained writer, and channel-ready exports.",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export default function RootPage() {
  return <HomePage appUrl={APP} />;
}

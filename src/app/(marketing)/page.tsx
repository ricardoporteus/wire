import type { Metadata } from "next";
import { Home } from "./_components/Home";

export const metadata: Metadata = {
  title: "Mavrix: your AI marketing team",
  description:
    "A four-person AI marketing team that measures what your buyers actually search, targets keywords you can win, protects your brand and writes the content. Get found on Google and quoted by AI.",
  openGraph: {
    title: "Mavrix: your AI marketing team",
    description: "Research, SEO and AEO, brand and writing, in one monthly sweep. Get found on Google, get quoted by AI.",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export default function Page() {
  return <Home />;
}

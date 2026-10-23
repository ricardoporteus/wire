import type { Metadata } from "next";
import { HomeV2 } from "./_components/HomeV2";

export const metadata: Metadata = {
  title: "Mavrix: get found and recommended by ChatGPT, Google and AI",
  description:
    "Mavrix measures what your buyers actually search, then writes and reshapes a month of on-brand content built to rank on Google and get quoted in AI answers. Drop your website, get 10 measured keywords and a 30-day plan. Free to start.",
  openGraph: {
    title: "Mavrix: get found and recommended by ChatGPT, Google and AI",
    description: "Measured keywords, a month of on-brand content, built to rank and get cited. The output of an agency, for less than one freelancer.",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomeV2 />;
}

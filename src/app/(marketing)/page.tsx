import type { Metadata } from "next";
import { HomeV2 } from "./_components/HomeV2";

export const metadata: Metadata = {
  title: "Mavrix: new customers can’t find you. We fix that.",
  description:
    "New customers can’t find you. Mavrix gets you found and recommended by ChatGPT, Google and AI answers, so you convert more customers. Drop your link for a free audit and a 30-day growth plan. Free to start.",
  openGraph: {
    title: "Mavrix: new customers can’t find you. We fix that.",
    description: "Get found and recommended by ChatGPT, Google and AI answers, and convert more customers. On-brand content built to rank and get cited.",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomeV2 />;
}

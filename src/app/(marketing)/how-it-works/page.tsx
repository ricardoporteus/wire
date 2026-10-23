import type { Metadata } from "next";
import { Home } from "../_components/Home";

export const metadata: Metadata = {
  title: "How it works — Mavrix",
  description:
    "See the full Mavrix workflow: a monthly research sweep that measures your market, scores every idea, protects your brand and writes the content. Get found on Google and quoted by AI.",
  alternates: { canonical: "/how-it-works" },
};

/** The original homepage, preserved in full and linked from the nav as "How it works". */
export default function Page() {
  return <Home />;
}

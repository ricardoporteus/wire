/**
 * Root route — serves two different things depending on the host.
 *
 *  - On the app host (app.mavrix.agency, i.e. NEXT_PUBLIC_APP_HOST) it routes a
 *    signed-in visitor to the dashboard, or to onboarding if their Brand Brain
 *    wizard isn't finished. Clerk's OrganizationSwitcher bounces here after an
 *    org is created, so this path must stay.
 *  - Everywhere else (the apex marketing domain, and localhost) it renders the
 *    marketing homepage. To exercise the app-host branch locally, set
 *    NEXT_PUBLIC_APP_HOST=localhost:3000.
 *
 * The homepage itself lives in ./_home (copy in content.ts). The previous
 * homepage is parked, intact, at /spare-home.
 */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, brandBrains } from "@/db/schema";
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

export default async function RootPage() {
  const host = (await headers()).get("host") ?? "";

  if (APP_HOST && host === APP_HOST) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) redirect("/dashboard"); // middleware bounces to Clerk sign-in
    const org = await db.query.organizations.findFirst({ where: eq(organizations.clerkOrgId, orgId) });
    const brain = org ? await db.query.brandBrains.findFirst({ where: eq(brandBrains.orgId, org.id) }) : null;
    redirect(brain?.wizardCompletedAt ? "/dashboard" : "/onboarding");
  }

  return <HomePage appUrl={APP} />;
}

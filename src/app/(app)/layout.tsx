/**
 * App shell for every signed-in surface. Renders the top nav + live credit
 * balance (hidden on onboarding, which is its own focused flow).
 */
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { AppHeader } from "./AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { orgId: clerkOrgId } = await auth();
  const org = clerkOrgId
    ? await db.query.organizations.findFirst({ where: eq(organizations.clerkOrgId, clerkOrgId) })
    : null;

  return (
    <>
      <AppHeader creditsBalance={org ? org.creditsBalance : null} />
      {children}
    </>
  );
}

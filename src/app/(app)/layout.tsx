/**
 * App shell for every signed-in surface. Renders the top nav + live credit
 * balance (hidden on onboarding, which is its own focused flow).
 *
 * ClerkProvider lives here rather than in the root layout so that the public
 * marketing and legal pages ship no Clerk JavaScript.
 */
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider>
      <AppHeader creditsBalance={org ? org.creditsBalance : null} />
      {children}
      <footer className="mx-auto mt-16 max-w-6xl px-6 py-8 text-caption text-muted">
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-6">
          <Link href="/legal/terms" className="hover:text-ink-green">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-ink-green">Privacy</Link>
          <Link href="/legal/ai-disclosure" className="hover:text-ink-green">AI disclosure</Link>
        </div>
      </footer>
    </ClerkProvider>
  );
}

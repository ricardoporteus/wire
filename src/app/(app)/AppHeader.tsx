"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/audit", label: "Audit" },
  { href: "/keywords", label: "Keywords" },
  { href: "/write", label: "Write" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
];

export function AppHeader({ creditsBalance }: { creditsBalance: number | null }) {
  const pathname = usePathname();
  // Onboarding is a focused flow — no app chrome until there's a workspace to navigate.
  if (pathname?.startsWith("/onboarding")) return null;

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <Link href="/dashboard" className="font-display text-h5 font-semibold text-ink-green">Wire</Link>
        <nav className="flex items-center gap-1">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname?.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-pill px-3 py-1.5 text-body-sm ${active ? "bg-accent-tint font-medium text-ink-green" : "text-muted hover:text-ink-green"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {creditsBalance !== null && (
            <Link href="/billing" className="badge badge--draft" title="Credit balance">
              {creditsBalance} credits
            </Link>
          )}
          <OrganizationSwitcher
            afterCreateOrganizationUrl="/onboarding"
            afterSelectOrganizationUrl="/dashboard"
            hidePersonal
          />
          <UserButton />
        </div>
      </div>
    </header>
  );
}

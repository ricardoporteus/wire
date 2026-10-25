"use client";

/**
 * The signed-in app shell: a full-width news ticker (row 1), then the left
 * navigation and the page content (row 2). Replaces the old top nav. Onboarding
 * is a focused flow, so it renders without the shell.
 */
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

const NAV: { href: string; label: string; who?: string }[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/audit", label: "Research", who: "Scout · Ada" },
  { href: "/content", label: "Content", who: "Quill · Iris" },
  { href: "/performance", label: "Performance", who: "Ada" },
  { href: "/brand", label: "Brand", who: "Iris" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
];

export type TickerItem = { label: string; value: string };

export function AppShell({
  creditsBalance, ticker, children,
}: {
  creditsBalance: number | null;
  ticker: TickerItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Onboarding is its own focused flow — no shell.
  if (pathname?.startsWith("/onboarding")) return <>{children}</>;

  const items = ticker.length ? ticker : [{ label: "Welcome to Mavrix", value: "your content engine" }];
  const ticks = (key: string) =>
    items.map((t, i) => (
      <span className="app-tick" key={`${key}-${i}`}>
        <b>{t.label}</b> <span className="sep">·</span> {t.value}
      </span>
    ));

  return (
    <div className="app-shell">
      <div className="app-ticker">
        <button className="menu" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">Menu</button>
        <span className="wm">Mavrix</span>
        <span className="app-live"><span className="dot" />LIVE</span>
        {/* duplicated once for a seamless marquee loop */}
        <div className="app-tickview"><div className="app-ticktrack">{ticks("a")}{ticks("b")}</div></div>
        {creditsBalance !== null && (
          <Link href="/billing" className="app-credits tabular-nums" title="Credit balance">
            {creditsBalance} credits
          </Link>
        )}
      </div>

      <div className="app-body">
        {open && <div className="app-backdrop" onClick={() => setOpen(false)} />}
        <aside className={`app-sidebar${open ? " open" : ""}`}>
          <OrganizationSwitcher
            afterCreateOrganizationUrl="/onboarding"
            afterSelectOrganizationUrl="/dashboard"
            hidePersonal
          />
          <nav className="app-navlist">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname?.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "true" : undefined}
                  className="app-navlink"
                  onClick={() => setOpen(false)}
                >
                  <span className="app-navname">{n.label}</span>
                  {n.who && <span className="app-navsub">{n.who}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="app-sidefoot">
            <div className="app-legal">
              <Link href="/legal/terms" className="hover:text-ink-green">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-ink-green">Privacy</Link>
              <Link href="/legal/ai-disclosure" className="hover:text-ink-green">AI disclosure</Link>
            </div>
            <UserButton />
          </div>
        </aside>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

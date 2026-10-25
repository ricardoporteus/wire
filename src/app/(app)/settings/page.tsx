import Link from "next/link";
import { OrganizationProfile } from "@clerk/nextjs";

/**
 * Settings — team, plan and account. The Brand Brain moved to its own /brand
 * area; this is just the account plumbing now.
 */
export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <span className="eyebrow">Settings</span>
      <h1 className="mt-4 text-h2 text-ink-green">Settings</h1>
      <p className="mt-2 text-body-sm text-muted">
        Your team, plan and account. Your brand voice and approved facts live in{" "}
        <Link href="/brand" className="font-semibold text-accent-strong">Brand</Link>.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/brand" className="btn-ghost">Brand Brain →</Link>
        <Link href="/billing" className="btn-ghost">Billing &amp; credits →</Link>
      </div>

      <section className="mt-10">
        <h2 className="text-h4 text-ink-green">Team</h2>
        <p className="mt-1 text-body-sm text-muted">Invite teammates and manage your workspace.</p>
        <div className="mt-4"><OrganizationProfile routing="hash" /></div>
      </section>
    </main>
  );
}

import Link from "next/link";

/** Shown when an action is blocked by insufficient credits. */
export function UpgradeNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`rounded-md border border-cream bg-[#FFF7EA] px-4 py-3 text-body-sm text-ink ${className}`}>
      You&apos;re out of credits for this.{" "}
      <Link href="/settings" className="font-medium text-accent-strong underline">Upgrade or top up →</Link>
    </p>
  );
}

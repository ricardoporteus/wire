"use client";

import { CreateOrganization } from "@clerk/nextjs";

/**
 * One Clerk Organization = one customer. A new user creates their workspace
 * here before the Brand Brain wizard; Clerk sends them back to /onboarding,
 * where the org now resolves and the wizard begins.
 */
export function CreateWorkspace() {
  return (
    <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-6 py-16">
      <div className="w-full">
        <span className="eyebrow">Welcome to Wire</span>
        <h1 className="mt-4 text-h3 text-ink-green">Create your workspace</h1>
        <p className="mt-2 text-muted">
          Your workspace holds your Brand Brain, your team, and your plan. You can rename it any time.
        </p>
        <div className="mt-8">
          <CreateOrganization
            afterCreateOrganizationUrl="/onboarding"
            skipInvitationScreen
          />
        </div>
      </div>
    </main>
  );
}

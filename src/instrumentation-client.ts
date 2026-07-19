/**
 * Sentry — browser init. Uses the public DSN (must be NEXT_PUBLIC_* to reach the
 * client). Session Replay is off by default to avoid capturing customers'
 * content; turn it on deliberately if you want it.
 *
 * The SDK is imported dynamically, behind the DSN check, because a static import
 * shipped roughly 400KB of Sentry to every visitor including the marketing
 * homepage, even with no DSN set and reporting disabled. The DSN is inlined at
 * build time, so with it unset this branch is dead and the chunk is never
 * requested.
 *
 * Tradeoff: when a DSN *is* set the SDK loads asynchronously, so an error in the
 * first few hundred milliseconds could be missed. If that ever matters more than
 * the bundle size, make the import static again.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

type RouterHook = (...args: unknown[]) => void;
let routerHook: RouterHook | undefined;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      enabled: true,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      environment: process.env.NODE_ENV,
    });
    routerHook = Sentry.captureRouterTransitionStart as unknown as RouterHook;
  });
}

/** Stable export: forwards to Sentry once loaded, no-ops when it never loads. */
export const onRouterTransitionStart: RouterHook = (...args) => routerHook?.(...args);

import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {};

/**
 * Sentry wrapping. Runtime error reporting is controlled by the DSN in the
 * sentry.*.config files (no DSN → no-op). The build-time plugin here only uploads
 * source maps when SENTRY_AUTH_TOKEN/ORG/PROJECT are set, so local/unconfigured
 * builds are unaffected.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  disableLogger: true,
});

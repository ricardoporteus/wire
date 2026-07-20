import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// /billing was previously unmatched: it rendered a blank page when signed out
// rather than bouncing to sign-in. Folded in here with the rest of the app.
const isProtected = createRouteMatcher([
  "/onboarding(.*)", "/dashboard(.*)", "/brains(.*)", "/write(.*)", "/settings(.*)", "/billing(.*)",
  "/audit(.*)", "/keywords(.*)",
]);

/**
 * One deployment serves two hosts: the marketing site on the apex and the app on
 * NEXT_PUBLIC_APP_HOST.
 *
 * Clerk runs on the app host only. Wrapping the marketing site in it was
 * expensive and pointless: on a dev instance Clerk answers the first request
 * with a handshake redirect (apex, then clerk.accounts.dev, then back), sets
 * third-party cookies, and stamps `cache-control: no-store` on a page that is
 * fully public. That cost roughly 700ms of redirects, blocked bf-cache, and
 * stopped the CDN caching the homepage at all. Marketing and legal pages need no
 * auth, so they skip Clerk entirely.
 *
 * Unset APP_HOST (local dev, preview deployments) means everything is treated as
 * the app host, so nothing changes locally.
 */
const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST;

const withClerk = clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const host = req.headers.get("host") ?? "";
  const isMarketingHost = Boolean(APP_HOST) && host !== APP_HOST;

  if (isMarketingHost) {
    // Product routes belong on the app host: redirect rather than serving them
    // in two places, which would split SEO and confuse anyone who bookmarks one.
    if (isProtected(req)) {
      return NextResponse.redirect(new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${APP_HOST}`));
    }
    return NextResponse.next();
  }

  // App host asking for "/": send them into the product. This lives here rather
  // than in the page so that "/" needs no request headers and can be prerendered
  // as static HTML. Reading headers() there made it dynamic, which meant
  // `cache-control: no-store` on the marketing homepage: no CDN caching and no
  // back/forward cache.
  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return withClerk(req, event);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};

import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// /billing was previously unmatched — it rendered a blank page when signed out
// rather than bouncing to sign-in. Folded in here with the rest of the app.
const isProtected = createRouteMatcher([
  "/onboarding(.*)", "/dashboard(.*)", "/brains(.*)", "/write(.*)", "/settings(.*)", "/billing(.*)",
]);

/**
 * One deployment serves two hosts: the marketing site on the apex and the app on
 * NEXT_PUBLIC_APP_HOST. Product routes belong on the app host, so a request for
 * one arriving on the apex is redirected rather than served in both places —
 * duplicate URLs split SEO and confuse anyone who bookmarks the wrong one.
 *
 * Unset APP_HOST (local dev, preview deployments) disables the cross-host rule
 * entirely, so every route stays reachable on localhost.
 */
const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST;

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get("host") ?? "";

  if (APP_HOST && host !== APP_HOST && isProtected(req)) {
    return NextResponse.redirect(new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${APP_HOST}`));
  }

  if (isProtected(req)) await auth.protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};

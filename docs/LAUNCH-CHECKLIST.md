# Mavrix marketing site — pre-launch checklist

Covers the `(marketing)` route group: `/` and `/products/{research,seo,brand,writer}`.
Tick these before promoting the site publicly.

## 1. Content: replace the placeholders
- [ ] **Testimonials** — every card is currently labelled *Sample* with "Sample Name". Swap in real customer quotes, names, roles (homepage has none; each product page has 3). Remove the ⚠ placeholder banner once real.
- [ ] **Case studies** — each product page has 2, labelled *Illustrative*, with made-up metrics. Replace with real outcomes or remove the sections until you have them. Remove the ⚠ banner.
- [ ] **"Read the full story ›"** links point to `#` — link to real case-study pages or drop the link.
- [ ] **Video walkthroughs** — the poster buttons are placeholders (they `alert()`). Paste a Loom (or other) embed per page: replace the poster with an `<iframe src="https://www.loom.com/embed/…">`. Homepage uses the interactive tab demo instead; add a real screen recording there if desired.
- [ ] **App mockups** — the in-page "screens" are representative SVG/HTML, not the real product. Swap for real screenshots before they imply live UI, or keep and confirm they're clearly illustrative.

## 2. Domain & deploy
- [ ] `git push origin main` completed and the Vercel deploy (project `wire`) is green.
- [ ] **Apex `mavrix.agency` is attached to the `wire` Vercel project.** Per project notes the apex may still be unclaimed (returns a Vercel 404). If so, add the domain in Vercel → Project → Domains, or the site won't surface at the apex even after a successful build.
- [ ] `www.mavrix.agency` redirects to the apex (or vice-versa) — pick one canonical host.
- [ ] Confirm middleware host routing: apex serves marketing, `app.mavrix.agency` serves the app, and `/dashboard` / "Start free" bounce correctly between hosts in production.

## 3. SEO / metadata
- [ ] `metadataBase` is `https://mavrix.agency` (set in `src/app/layout.tsx`) — confirm it matches the live apex.
- [ ] Per-page titles/descriptions/canonicals read correctly (view source on each of the 5 routes).
- [ ] Add an **OG/Twitter share image** (currently none) — `opengraph-image` or a static asset referenced in metadata.
- [ ] `robots.txt` and a `sitemap.xml` covering the 5 marketing routes.
- [ ] Favicon/`icon.svg` is the Mavrix mark, not a leftover.

## 4. Links & functionality (QA on the deployed site)
- [ ] Header **Products dropdown** → all four product pages (desktop).
- [ ] **Mobile hamburger menu** opens, links work, current page shows active, closes on tap.
- [ ] Homepage **team cards** deep-link to the matching product pages.
- [ ] Product pages cross-link to each other + back to `/`.
- [ ] All internal links open **same-tab**; "Start free"/"Sign in" reach the app.
- [ ] Homepage **Crew/Pro toggle** flips names + avatars (see §6).
- [ ] FAQ accordions, demo tabs, starfield, count-ups all behave; nothing errors in the console.

## 5. Responsive / accessibility / performance
- [ ] Check mobile, tablet, desktop widths — no horizontal scroll; hero and grids reflow.
- [ ] `prefers-reduced-motion` respected (starfield/count-ups should freeze) — verify.
- [ ] Keyboard: dropdown reachable via focus, mobile toggle operable, visible focus states.
- [ ] Colour contrast on lime/sky chips and muted text passes AA.
- [ ] Lighthouse pass (perf/SEO/a11y) on `/` and one product page.

## 6. Brand / legal
- [ ] Public default is the **professional names** (Scout/Ada/Iris/Quill) — confirm the site loads in that mode.
- [ ] The optional **"Crew" toggle** swaps to aviator avatars + callsign names as an 80s-aviation homage. The avatars are original artwork, but the callsign set evokes a well-known film. **Get a legal sign-off before promoting the Crew mode**, or leave the toggle off/removed for launch.
- [ ] No fabricated social proof remains live (ties back to §1).
- [ ] Terms / Privacy / AI-disclosure links in the footer resolve.

## 7. Analytics & post-launch
- [ ] Analytics installed (e.g. Vercel Analytics / Plausible) on the marketing routes.
- [ ] Primary CTA conversions tracked ("Start free").
- [ ] After go-live, re-crawl in Search Console and submit the sitemap.

---
_Old homepage: the previous SyncMaster-based page (`src/app/page.tsx`) was removed; `src/app/spare-home` and `src/app/_home` remain in the repo and can be deleted once the new site is confirmed._

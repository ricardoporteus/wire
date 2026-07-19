/**
 * Spare homepage — the first marketing homepage, parked here when the SyncMaster
 * template replaced it at `/`. Kept whole and working so it can be restored or
 * cannibalised for copy; noindexed so it never competes with the live homepage
 * in search.
 *
 * Copy rule, inherited: every claim maps to something the product actually does,
 * and credit costs and plan grants are imported from the real constants rather
 * than retyped, so marketing can't drift from billing.
 */
import type { Metadata } from "next";
import { CREDIT_COSTS, PLAN_GRANTS } from "@/lib/credits";

const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST;
/** Absolute when the app lives on its own host; relative in local dev. */
const APP = APP_HOST ? `https://${APP_HOST}` : "";

export const metadata: Metadata = {
  title: "Wire: the content engine for CMOs (spare homepage)",
  robots: { index: false, follow: false },
};

export default function SpareHomePage() {
  return <Marketing />;
}

/* ==========================================================================
   Content — single source of truth for the page's copy
   ========================================================================== */

/** The six research stages, in the order the pipeline runs them. */
const STAGES = [
  { n: "01", title: "Keyword intelligence", body: "High-intent, informational and long-tail phrases, each scored for difficulty and ranked by priority with the reasoning attached." },
  { n: "02", title: "Competitor sweep", body: "Who is ranking for your space, the topics and keywords they own, and where their coverage is thin." },
  { n: "03", title: "Content gaps", body: "Topics your market cares about that nobody has covered well, with a suggested angle for each." },
  { n: "04", title: "AI search (AEO)", body: "The People Also Ask questions and featured-snippet formats that decide whether you get quoted by AI answers." },
  { n: "05", title: "Trends", body: "What is moving in your category right now, and the current best practices for covering it." },
  { n: "06", title: "Ranked ideas", body: "Everything above collapsed into a queue of specific pieces to write, each tied to a target keyword or question." },
];

/** Lines for the animated feed panel — mirrors the real run_events stream. */
const FEED = [
  { t: "search", s: "Searching: \"B2B onboarding benchmarks 2026\"" },
  { t: "source", s: "Read: Forrester, State of B2B Onboarding" },
  { t: "ok", s: "Keyword stage complete: 34 phrases, 11 high-intent" },
  { t: "search", s: "Searching: competitor content velocity" },
  { t: "source", s: "Read: competitor blog, 42 posts indexed" },
  { t: "ok", s: "Competitor stage complete: 5 profiled" },
  { t: "search", s: "Searching: People Also Ask, activation metrics" },
  { t: "ok", s: "AEO stage complete: 18 questions, 6 snippet targets" },
  { t: "refine", s: "Refining: tightening idea titles to target keywords" },
  { t: "ok", s: "Ideas ranked: 12 briefs queued" },
];

const WRITER = [
  ["Writes from your Brand Brain", "Voice, positioning, ICP and approved facts come from the brand document you signed off, not from the model's imagination."],
  ["Terminology guardrails", "Ban the words your brand doesn't use. Wire enforces them on whole words, so banning \"cure\" never mangles \"secure\", and runs a repair pass if any slip through."],
  ["No em dashes, ever", "A hard rule in the writer, not a preference in a prompt. En dashes survive in ranges, where they belong."],
  ["Word counts you can trust", "Length is measured from the finished markdown, not taken from the model's own estimate, which is routinely wrong by an order of magnitude."],
  ["Targeted regeneration", "Leave a note on a draft and Wire revises that, instead of rewriting the piece from scratch and losing what you liked."],
  ["Live progress throughout", "Research and drafting both stream what they are doing, so a long job never looks like a crashed one."],
];

const FAQ = [
  ["Does Wire publish to my CMS?", "Not yet. Wire takes you to an approved draft and channel-ready exports that you copy or download. Publishing integrations are not built."],
  ["Is the content AI-generated?", "Yes, and we say so plainly in our AI-content disclosure. Wire is built for teams who edit and take ownership of what they publish, not for unattended posting."],
  ["How does it avoid making things up?", "The writer works from the approved facts in your Brand Brain and the sources gathered during research. It is a guardrail, not a guarantee. Every draft still needs a human read before it ships."],
  ["What happens when credits run out?", "Top up at $99 per 300 credits, or move up a plan. Annual billing includes two months free."],
  ["Can I run intelligence more than once a month?", "Yes. Runs are on demand as well as scheduled, subject to your credit balance and a fair-use rate limit."],
];

/* ==========================================================================
   Pricing
   --------------------------------------------------------------------------
   Plan prices live in the Clerk dashboard, which is the billing source of
   truth. Set `price` below once and this section fills in; until then each tier
   links through to the live pricing table rather than showing a made-up number.
   ========================================================================== */
type Tier = { slug: keyof typeof PLAN_GRANTS; name: string; price: string | null; blurb: string; best: boolean };
const TIERS: Tier[] = [
  { slug: "launch", name: "Launch", price: null, best: false, blurb: "One brand, one marketer, a steady publishing rhythm." },
  { slug: "growth", name: "Growth", price: null, best: true, blurb: "A content team working several channels at once." },
  { slug: "scale", name: "Scale", price: null, best: false, blurb: "Multiple brands or portfolio companies under one roof." },
];

/** Turn a credit grant into the output it actually buys, using the real costs. */
function whatItBuys(credits: number) {
  const articles = Math.floor((credits - CREDIT_COSTS.intelligence_run) / CREDIT_COSTS.generation);
  return `1 intelligence run + about ${articles} long-form articles a month`;
}

/* ==========================================================================
   Page
   ========================================================================== */

function Marketing() {
  return (
    <div className="bg-bg">
      <SiteHeader />

      {/* header / main / footer as sibling landmarks, matching the live homepage. */}
      <main>
      {/* ---- Hero ---------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-section-sm md:pt-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="eyebrow">For Series A/B marketing teams</span>
            <h1 className="mt-5 text-h3 md:text-display-xl">
              Your content engine researches before it writes.
            </h1>
            <p className="mt-5 max-w-xl text-body text-muted">
              Most AI tools start generating on the first keystroke. Wire starts by learning your brand, then
              sweeps your market for what is actually worth writing, and only then drafts it in your voice.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={`${APP}/dashboard`} className="btn-primary">Start free →</a>
              <a href="#how" className="btn-ghost">See how it works</a>
            </div>
            <p className="mt-4 text-caption text-muted">
              Every workspace starts with {PLAN_GRANTS.trial} trial credits.
            </p>
          </div>

          <FeedPanel />
        </div>
      </section>

      {/* ---- The problem --------------------------------------------------- */}
      <section className="border-y border-line bg-bg-alt">
        <div className="mx-auto max-w-6xl px-6 py-section-sm">
          <h2 className="max-w-2xl text-h4 md:text-h3">Three ways content operations quietly stall.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ["Fluent about nothing", "A general model writes beautifully and says nothing only your company could say. It has never read your positioning."],
              ["Research that stops at a spreadsheet", "Keyword tools hand you a list. Turning that list into a plan is still a week of someone's month."],
              ["Rebuilt by hand for every channel", "The article is done, and now someone reformats it for LinkedIn, the newsletter and the socials, one at a time."],
            ].map(([title, body]) => (
              <div key={title} className="card">
                <h3 className="text-h5">{title}</h3>
                <p className="mt-2 text-body-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- How it works -------------------------------------------------- */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-section-sm">
        <span className="eyebrow eyebrow--cream">How it works</span>
        <h2 className="mt-5 max-w-2xl text-h4 md:text-h3">Brand first, research second, writing last.</h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            ["Build the Brand Brain", "Wire reads your site and any documents you add, then proposes your differentiator, ICP, values, approved facts and banned terminology. You edit and approve it. Nothing gets written until you do."],
            ["Run the intelligence sweep", "Six research stages with live web search, from keyword intent through AI-search questions, ending in a ranked queue of specific pieces to write."],
            ["Write and repurpose", "Pick an idea, watch the draft build, leave notes for targeted revisions, then export it for every channel in one pass."],
          ].map(([title, body], i) => (
            <div key={title}>
              <div className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent font-display font-semibold text-ink-green">
                {i + 1}
              </div>
              <h3 className="mt-4 text-h5">{title}</h3>
              <p className="mt-2 text-body-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- The sweep ----------------------------------------------------- */}
      <section className="border-y border-line bg-bg-alt">
        <div className="mx-auto max-w-6xl px-6 py-section-sm">
          <span className="eyebrow">The monthly sweep</span>
          <h2 className="mt-5 max-w-2xl text-h4 md:text-h3">Six research stages, minutes not weeks.</h2>
          <p className="mt-3 max-w-2xl text-body text-muted">
            Each stage searches the live web, reads what it finds, and hands its findings to the next one. You watch
            the whole thing happen.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s) => (
              <div key={s.n} className="card">
                <span className="font-display text-caption font-semibold text-accent-strong">{s.n}</span>
                <h3 className="mt-2 text-h5">{s.title}</h3>
                <p className="mt-2 text-body-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- The writer ---------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 py-section-sm">
        <span className="eyebrow eyebrow--cream">The writer</span>
        <h2 className="mt-5 max-w-2xl text-h4 md:text-h3">Opinionated where it counts.</h2>
        <p className="mt-3 max-w-2xl text-body text-muted">
          The difference between a draft you edit and a draft you rewrite is a hundred small rules. These are ours.
        </p>

        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {WRITER.map(([title, body]) => (
            <div key={title} className="border-t border-line pt-5">
              <h3 className="text-h5">{title}</h3>
              <p className="mt-2 text-body-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Repurposing --------------------------------------------------- */}
      <section className="border-y border-line bg-navy">
        <div className="mx-auto max-w-6xl px-6 py-section-sm">
          <span className="eyebrow">One piece, every channel</span>
          <h2 className="mt-5 max-w-2xl text-h4 text-white md:text-h3">
            Written once, reshaped for where it lands.
          </h2>
          <p className="mt-3 max-w-2xl text-body text-white/70">
            Repurposing is a rewrite for a different room, not a copy-paste with the line breaks moved. Each format
            has its own brief.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["LinkedIn article", "LinkedIn post", "Newsletter block", "Markdown export"].map((k) => (
              <span key={k} className="rounded-pill border border-white/20 px-4 py-2 text-body-sm text-white/90">
                {k}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Pricing ------------------------------------------------------- */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-section-sm">
        <span className="eyebrow">Pricing</span>
        <h2 className="mt-5 max-w-2xl text-h4 md:text-h3">Every tool on every plan.</h2>
        <p className="mt-3 max-w-2xl text-body text-muted">
          Tiers differ by credits, Brand Brains and seats, never by which features you are allowed to touch.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.slug} className={`card flex flex-col ${t.best ? "border-accent-strong" : ""}`}>
              {/* Reserved whether or not the badge shows, so all three cards stay aligned. */}
              <div className="mb-4 h-8">{t.best && <span className="eyebrow">Most popular</span>}</div>
              <h3 className="text-h4">{t.name}</h3>
              <p className="mt-1 text-body-sm text-muted">{t.blurb}</p>
              <p className="mt-5 font-display text-h4 text-ink-green">
                {t.price ?? <span className="text-h5 text-muted">See live pricing</span>}
              </p>
              <p className="mt-4 text-body-sm text-ink">
                <strong>{PLAN_GRANTS[t.slug].toLocaleString()} credits</strong> a month
              </p>
              <p className="mt-1 text-caption text-muted">{whatItBuys(PLAN_GRANTS[t.slug])}</p>
              <a href={`${APP}/billing`} className={`${t.best ? "btn-primary" : "btn-ghost"} mt-6 justify-center`}>
                Get started
              </a>
            </div>
          ))}
        </div>

        {/* Credit costs — published, because opaque credits are how usage pricing earns distrust. */}
        <div className="card mt-8">
          <h3 className="text-h5">What a credit buys</h3>
          <div className="mt-4 grid gap-x-8 gap-y-2 text-body-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Monthly intelligence run", CREDIT_COSTS.intelligence_run],
              ["Long-form article", CREDIT_COSTS.generation],
              ["Repurpose pack", CREDIT_COSTS.repurpose],
              ["Targeted regeneration", CREDIT_COSTS.regeneration],
              ["Idea diagnosis", CREDIT_COSTS.diagnosis],
            ].map(([label, cost]) => (
              <div key={String(label)} className="flex justify-between border-b border-line py-1.5">
                <span className="text-muted">{label}</span>
                <span className="font-medium text-ink-green">{cost} {cost === 1 ? "credit" : "credits"}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-caption text-muted">
            Top-ups are $99 per 300 credits. Annual billing includes two months free.
          </p>
        </div>
      </section>

      {/* ---- FAQ ----------------------------------------------------------- */}
      <section className="border-t border-line bg-bg-alt">
        <div className="mx-auto max-w-3xl px-6 py-section-sm">
          <h2 className="text-h4 md:text-h3">Questions</h2>
          <div className="mt-8">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group border-b border-line py-4">
                <summary className="cursor-pointer list-none font-display text-h5 text-ink-green marker:content-none">
                  {q}
                </summary>
                <p className="mt-3 text-body-sm text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Closing CTA --------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 py-section-sm text-center">
        <h2 className="text-h4 md:text-h3">See what your market is asking this month.</h2>
        <p className="mx-auto mt-3 max-w-xl text-body text-muted">
          Build your Brand Brain, fire the first sweep, and watch the queue fill up.
        </p>
        <a href={`${APP}/dashboard`} className="btn-primary mt-8">Start free →</a>
      </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ==========================================================================
   Pieces
   ========================================================================== */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <a href="/" className="font-display text-h5 font-semibold text-ink-green">Wire</a>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {[["How it works", "#how"], ["Pricing", "#pricing"]].map(([label, href]) => (
            <a key={href} href={href} className="rounded-pill px-3 py-1.5 text-body-sm text-muted hover:text-ink-green">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <a href={`${APP}/dashboard`} className="text-body-sm text-muted hover:text-ink-green">Sign in</a>
          <a href={`${APP}/dashboard`} className="btn-accent !px-5 !py-2.5">Start free</a>
        </div>
      </div>
    </header>
  );
}

/**
 * Animated stand-in for the live run feed. The lines are representative, not a
 * recording — but the shapes (search → source → stage complete → refine) are
 * exactly what the real feed emits. Global CSS disables this under
 * prefers-reduced-motion.
 */
function FeedPanel() {
  const dot = { search: "badge--opportunity", source: "badge--draft", ok: "badge--published", refine: "badge--queued" } as const;
  return (
    <div className="card--lg card overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="font-display text-h5 text-ink-green">Intelligence run</p>
        <span className="badge badge--published">live</span>
      </div>
      <p className="mt-1 text-caption text-muted">Stage 4 of 6 · 18 sources read</p>

      <div className="feed-window mt-5 h-64 overflow-hidden">
        <div className="feed-track">
          {[...FEED, ...FEED].map((line, i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <span className={`badge ${dot[line.t as keyof typeof dot]} mt-0.5 shrink-0`} />
              <span className="text-body-sm text-ink">{line.s}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .feed-window { -webkit-mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent);
                               mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent); }
        .feed-track { animation: feed-scroll 26s linear infinite; }
        @keyframes feed-scroll { from { transform: translateY(0); } to { transform: translateY(-50%); } }
      `}</style>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-display text-h5 font-semibold text-ink-green">Wire</p>
            <p className="mt-1 text-caption text-muted">The content engine for CMOs.</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-caption">
            <a href="#how" className="text-muted hover:text-ink-green">How it works</a>
            <a href="#pricing" className="text-muted hover:text-ink-green">Pricing</a>
            <a href="/legal/terms" className="text-muted hover:text-ink-green">Terms</a>
            <a href="/legal/privacy" className="text-muted hover:text-ink-green">Privacy</a>
            <a href="/legal/ai-disclosure" className="text-muted hover:text-ink-green">AI disclosure</a>
          </nav>
        </div>
        <p className="mt-8 border-t border-line pt-6 text-caption text-muted">
          © {new Date().getFullYear()} {"[Wire, Inc.]"}. The content engine for CMOs.
        </p>
      </div>
    </footer>
  );
}

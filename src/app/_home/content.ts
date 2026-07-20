/**
 * Homepage copy and assets, in one place. Edit strings here; no JSX required.
 *
 * Two rules this file keeps to:
 *  1. Every claim maps to something Wire actually does. Credit costs and plan
 *     grants are imported from the real constants, so marketing cannot drift
 *     from billing.
 *  2. No invented social proof. Wire has no customers yet, so there is no logo
 *     wall, no testimonials, no awards, and the stats are product facts rather
 *     than customer outcomes.
 *
 * No em dashes in any shipped string: the product promises it, the site keeps to
 * it.
 *
 * Images in /public/syncmaster are still the SyncMaster template's demo assets
 * (stock photography and email-app screenshots). They are placeholders and need
 * replacing with real Wire product shots before launch.
 */
// From lib/credit-costs, not lib/credits: the latter imports Drizzle and the
// Neon driver, and this file is reached from a client component.
import { CREDIT_COSTS, PLAN_GRANTS } from "@/lib/credit-costs";

const IMG = "/syncmaster";

export const ASSETS = {
  logoWhite: `${IMG}/grW2crl5ErlDL9dI4X1ZJx3WXY.svg`,
  logoDark: `${IMG}/OeoHkSGFsRPeWzoRFzVqK7uKeY.svg`,
  // Hero composition
  heroMail: `${IMG}/AaJP0UBMvh2A0bfIidOMGR6jyKc.png`,
  heroSearch: `${IMG}/II8aGf3lCJu9E4RjMSW5fOL4co.png`,
  heroContact: `${IMG}/cpwgrB0JfCHlf9qc6E1COXbs.png`,
  heroNotion: `${IMG}/FFegGrGXJwzJc0R2CcMhiOjFS00.png`,
  heroGmail: `${IMG}/TTcOPT9eTvQ0XC3NrPxsaJyYzYA.png`,
  arrowDown: `${IMG}/2slqc27k3bYApD7DosxdbQGaBs.png`,
  arrowCurve: `${IMG}/dLB2NZbbqPGSVCWkkRngzC2gdw.png`,
  headlineArrow: `${IMG}/kHeYg9J6OvYIlEzD4wBTvzK6A0.svg`,
  // Product chrome
  panelSearch: `${IMG}/R0Qv63AwvDD7dNEtxpgUfrMzEHg.png`,
  panelList: `${IMG}/rX0hRkZFgjZi28xuJaw7gPmxZyY.png`,
  panelDash: `${IMG}/Zp2U1zCpdlKr615lSRn3j1UveWU.png`,
  panelMail2: `${IMG}/sh9quaXSuHGQLOhEaB38u6L6jg.png`,
  iconGrowth: `${IMG}/D0gZxSav3Kp15USvXeh2cgTR4.svg`,
  /** The template's list bullet: appears 8x consecutively in the export, once per plan feature. */
  iconBullet: `${IMG}/KHDC67PrjDSpXK1jZRxS1LFrgW4.svg`,
  iconBranch: `${IMG}/cCrfWIq8oxphv1FwljaxysaSbE.svg`,
  // Photography
  photoA: `${IMG}/34wjagNyVMR6sWCyj25Gn0gEhmk.png`,
  photoB: `${IMG}/msqG2qKDQGUmxeacPTQYb9mkNU.png`,
  photoC: `${IMG}/xfFHOM4PFgX1P4828pYJOJjmzew.png`,
  photoD: `${IMG}/YQvQvZ0l1greLycViXt0gGdV5E.png`,
  photoE: `${IMG}/KPq4kkjgIWixvsgCNwguL0CSo.png`,
  // Product chrome used in the split sections
  cardStats: `${IMG}/R7BWWVxi3ZAhhzqBV55sh9Ius.png`,
  cardCountries: `${IMG}/aUmY4XBmHbiuXYngmOkUJC00U.png`,
} as const;

export const NAV = [
  { label: "How it works", href: "#how" },
  { label: "The sweep", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export const HERO = {
  tagNew: "NEW",
  tagText: "Increase traffic and sales using SEO and AEO-optimised content",
  title: "Convert any source of content into traffic and business growth opportunity",
  body: "Add voice notes, YouTube podcasts, and blog posts and automatically repurpose them into keyword-researched, new trend and gap opportunities for fast growth content instantly.",
  primary: "Start free",
  secondary: "See how it works",
};

/**
 * Hero feed panel. Representative lines, not a recording, but every shape here is
 * one the real run feed emits: search issued, source read, stage complete with
 * counts, refinement pass.
 */
export const FEED = {
  title: "Intelligence run",
  status: "live",
  meta: "Stage 4 of 6 · 18 sources read",
  lines: [
    { t: "search", s: "Searching: competitor content velocity" },
    { t: "source", s: "Read: competitor blog, 42 posts indexed" },
    { t: "ok", s: "Competitor stage complete: 5 profiled" },
    { t: "search", s: "Searching: People Also Ask, activation metrics" },
    { t: "ok", s: "AEO stage complete: 18 questions, 6 snippet targets" },
    { t: "refine", s: "Refining: tightening idea titles to target keywords" },
    { t: "search", s: "Searching: \"B2B onboarding benchmarks 2026\"" },
    { t: "source", s: "Read: Forrester, State of B2B Onboarding" },
    { t: "ok", s: "Keyword stage complete: 34 phrases, 11 high-intent" },
    { t: "ok", s: "Ideas ranked: 12 briefs queued" },
  ],
};

/**
 * Replaces the template's customer logo wall. Wire has no customers to name yet,
 * so this states what a sweep contains instead of implying social proof.
 */
export const STAGE_STRIP = {
  title: "Six research stages run in a single sweep",
  stages: ["Keyword intelligence", "Competitor sweep", "Content gaps", "AI search (AEO)", "Trends", "Ranked ideas"],
};

export const FEATURES = {
  eyebrow: "How Wire works",
  title: "Brand Guidelines First, Research and Repurpose Second, Writing Last",
  /**
   * Which tab opens first, by label. Only the active panel is server-rendered,
   * so this decides which copy search engines actually index. Research leads
   * because that panel carries the keyword and market-trend pitch, even though
   * Repurpose sits first in the row.
   */
  defaultTab: "Research",
  tabs: [
    {
      label: "Repurpose",
      panelTitle: "One piece, reshaped for where it lands",
      img: ASSETS.panelSearch,
      imgAlt: ASSETS.panelList,
      items: [
        {
          icon: ASSETS.iconGrowth,
          title: "A brief per channel",
          body: "A LinkedIn post is not the article with shorter paragraphs. Each format gets its own spec, hook and length.",
        },
        {
          icon: ASSETS.iconBranch,
          title: "The whole pack in one pass",
          body: "Request every format you need and Wire generates them together, so the piece ships everywhere the same day.",
        },
      ],
    },
    {
      label: "Research",
      panelTitle: "Deep Dive Keyword and Market Trend Research in Minutes",
      img: ASSETS.panelDash,
      imgAlt: ASSETS.cardStats,
      items: [
        {
          icon: ASSETS.iconGrowth,
          title: "Keywords scored, not just listed",
          body: "High-intent, informational and long-tail phrases, each rated for difficulty and ranked by priority with the reasoning attached.",
        },
        {
          icon: ASSETS.iconBranch,
          title: "SEO opportunities your competition left open",
          body: "Market trends and SEO gap opportunity gets compiled instantly and your content is repurposed to match, giving you a faster and higher success chance of growing traffic utilising real-time opportunities.",
        },
      ],
    },
    {
      label: "Write",
      panelTitle: "Drafts written against a brand you approved",
      img: ASSETS.panelMail2,
      imgAlt: ASSETS.cardCountries,
      items: [
        {
          icon: ASSETS.iconGrowth,
          title: "Your positioning, not the model's",
          body: "Voice, ICP, differentiator and approved facts come from the Brand Brain you signed off. Nothing is written until you do.",
        },
        {
          icon: ASSETS.iconBranch,
          title: "Guardrails that actually hold",
          body: "Banned terms are enforced on whole words, so blocking \"cure\" never mangles \"secure\", and a repair pass catches anything that slips.",
        },
      ],
    },
  ],
};

export const TOOLS = {
  eyebrow: "Three steps",
  title: "From a blank brand to a queue of briefs",
  cards: [
    { title: "Build your Brand Brain", cta: "How it works", img: ASSETS.photoA },
    { title: "Run the monthly sweep", cta: "How it works", img: ASSETS.photoB },
    { title: "Write, then repurpose", cta: "How it works", img: ASSETS.photoC },
  ],
};

export const SPLITS = [
  {
    title: "Watch the research happen, line by line",
    body: "A long job that shows nothing looks like a crashed one. Wire streams every search it runs and every source it reads, so you can see the work instead of guessing at it.",
    listTitle: "What the live feed shows you",
    list: [
      "Every search query as it is issued",
      "Every source title as it is read",
      "Each stage completing, with its counts",
    ],
    cta: "Start free",
    img: ASSETS.cardCountries,
    imgAlt: ASSETS.cardStats,
    flip: false,
  },
  {
    title: "A writer with rules, not vibes",
    body: "Most AI drafts need rewriting rather than editing. The difference is a hundred small rules, and these are the ones we hold to.",
    listTitle: "Built into the writer",
    list: [
      "No em dashes, ever. En dashes survive in ranges.",
      "Word counts measured from the draft, not self-reported",
      "Leave a note and it revises that, not the whole piece",
    ],
    cta: "Start free",
    img: ASSETS.panelMail2,
    imgAlt: ASSETS.cardStats,
    flip: true,
  },
];

/**
 * Plan prices live in the Clerk dashboard, which is the billing source of truth.
 * Until the three figures are set there and copied in here, each tier shows the
 * credit allowance and links through to the live pricing table, rather than a
 * number invented for the sake of the layout.
 */
export const PRICING = {
  eyebrow: "Match your needs",
  title: "Every tool on every plan",
  note: "Tiers differ by credits, Brand Brains and seats, never by which features you are allowed to touch.",
  toggle: { left: "Billed Yearly", right: "Billed Monthly" },
  yearlyNote: "Annual billing includes two months free.",
  monthlyNote: "Month to month, cancel any time.",
  plans: [
    {
      name: "Launch",
      blurb: "One brand, one marketer, a steady publishing rhythm",
      credits: PLAN_GRANTS.launch,
      priceLabel: "See live pricing",
      featuresTitle: "Included",
      features: [
        "1 Brand Brain",
        "All four tools, no feature gates",
        "Monthly sweep plus on demand runs",
        "Email support",
      ],
      cta: "Start free",
      featured: false,
    },
    {
      name: "Growth",
      blurb: "A content team working several channels at once",
      credits: PLAN_GRANTS.growth,
      priceLabel: "See live pricing",
      featuresTitle: "Everything in Launch, plus",
      features: [
        "More seats for the team",
        "Higher run limits",
        "Priority support",
        "Full repurposing pack",
      ],
      cta: "Start free",
      featured: true,
    },
    {
      name: "Scale",
      blurb: "Multiple brands or portfolio companies under one roof",
      credits: PLAN_GRANTS.scale,
      priceLabel: "See live pricing",
      featuresTitle: "Everything in Growth, plus",
      features: [
        "Multiple Brand Brains",
        "Highest run limits",
        "Dedicated onboarding",
        "Priority support",
      ],
      cta: "Start free",
      featured: false,
    },
  ],
  topUp: `Top ups are $99 per 300 credits. A long form article is ${CREDIT_COSTS.generation} credits, a repurpose pack ${CREDIT_COSTS.repurpose}, a monthly sweep ${CREDIT_COSTS.intelligence_run}.`,
};

/**
 * The template ran customer outcome stats here (100K clients, 80% faster). Wire
 * has none to report, so these are product facts instead, each checkable in the
 * app: research stages, the cost of an article, and the trial grant.
 */
export const STATS = {
  eyebrow: "Wire by the numbers",
  title: "What you actually get",
  items: [
    {
      value: 6,
      suffix: "",
      label: "Research stages per sweep",
      body: "Keywords, competitors, gaps, AI search, trends and ranked ideas. Each one searches the live web and feeds the next.",
      img: ASSETS.photoD,
    },
    {
      value: CREDIT_COSTS.generation,
      suffix: "",
      label: "Credits for a long form article",
      body: "Published rather than hidden, because opaque usage pricing is how trust gets lost. A repurpose pack is five.",
      img: ASSETS.photoB,
    },
    {
      value: PLAN_GRANTS.trial,
      suffix: "",
      label: "Trial credits in every workspace",
      body: "Enough to build your Brand Brain, run a full sweep and write your first pieces before deciding anything.",
      img: ASSETS.photoE,
    },
  ],
};

/** Replaces the template's third party integration logos: Wire has no integrations yet. */
export const CHANNELS = {
  title: "Written once, reshaped for where it lands",
  body: "Repurposing is a rewrite for a different room, not a copy and paste with the line breaks moved. Each format carries its own brief.",
  cta: "Start free",
  items: [
    { name: "LinkedIn article", note: "600 to 900 words, feed-shaped" },
    { name: "LinkedIn post", note: "120 to 220 words, one idea" },
    { name: "Newsletter block", note: "Subject line plus teaser" },
    { name: "Markdown export", note: "Straight into your CMS" },
  ],
};

export const CTA = {
  title: "See what your market is asking this month",
  body: "Build your Brand Brain, fire the first sweep, and watch the queue fill up.",
  primary: "Start free",
  secondary: "See pricing",
};

export const FOOTER = {
  body: "Wire is the content engine for CMOs. Research first, written against your brand, ready for every channel.",
  columns: [
    {
      title: "PRODUCT",
      links: [
        { label: "How it works", href: "#how" },
        { label: "The sweep", href: "#features" },
        { label: "Pricing", href: "#pricing" },
      ],
    },
    {
      title: "LEGAL",
      links: [
        { label: "Terms of Service", href: "/legal/terms" },
        { label: "Privacy Policy", href: "/legal/privacy" },
        { label: "AI-Content Disclosure", href: "/legal/ai-disclosure" },
      ],
    },
    {
      title: "COMPANY",
      links: [{ label: "Sign in", href: "/dashboard" }],
    },
  ],
  copyright: "[Wire, Inc.]. The content engine for CMOs.",
};

/**
 * Synthetic tenants for the writer quality gate. Three deliberately different
 * brands — a B2B SaaS, a DTC wellness brand, and an SMB fintech — each with its
 * own voice, banned words, mandatory terminology, approved facts and formats.
 * A good writer must sound like a different company for each; the eval checks it.
 */
import type { BrandBrain } from "../lib/brand-brain.zod";

export type EvalTask = {
  tenant: string;          // brand key
  format: BrandBrain["formats"][number]["format"];
  title: string;           // stands in for the confirmed diagnosis title
  coreMessage: string;
  targetKeyword: string;
  source: string;          // raw source material
};

export const TENANTS: Record<string, BrandBrain> = {
  ledgerly: {
    name: "Ledgerly",
    siteUrl: "https://ledgerly.example",
    whatTheyDo: "Ledgerly is spend-management software that gives finance teams real-time control over company cards, approvals, and reconciliation in one place.",
    differentiator: "The only spend-management platform that closes the books continuously instead of once a month.",
    icp: {
      who: "Finance leaders (Controllers, VPs of Finance) at 50–500-person software companies.",
      segments: ["Series B–D SaaS finance teams", "RevOps-adjacent controllers"],
      geographies: ["United States", "Canada"],
      painPoints: ["Month-end close takes two weeks", "No real-time view of committed spend", "Card approvals live in email threads"],
      searchBehaviour: "They search for concrete finance-ops problems and comparisons, not category buzzwords.",
    },
    competitors: [{ url: "https://ramp.com", name: "Ramp" }, { url: "https://brex.com", name: "Brex" }],
    voice: {
      pillars: [
        { name: "Precise", description: "Exact, numerate, no hand-waving." },
        { name: "Calm authority", description: "Confident without hype." },
        { name: "Practical", description: "Every claim ties to a finance workflow." },
      ],
      personality: [
        { is: "Expert", notBut: "condescending" },
        { is: "Direct", notBut: "blunt" },
      ],
      principles: ["Lead with the finance outcome, not the feature", "Use real numbers over adjectives", "Never overpromise on compliance"],
      locale: "en-US",
      headlineStyle: "Title Case, specific, outcome-forward.",
    },
    vocabulary: {
      preferredVerbs: ["reconcile", "close", "control"], preferredNouns: ["spend", "controls", "close"], preferredAdjectives: ["real-time", "continuous"],
      terminology: [
        { use: "spend management", never: ["expense tracking", "expense management"] },
        { use: "the close", never: ["month-end madness"] },
      ],
      banned: ["revolutionary", "cutting-edge", "game-changer", "synergy"],
    },
    values: [
      { name: "Accuracy", description: "Numbers are right the first time." },
      { name: "Transparency", description: "No hidden fees, no black boxes." },
    ],
    approvedFacts: [
      { topic: "close", fact: "Ledgerly customers close the books in an average of 3 days." },
      { topic: "integrations", fact: "Ledgerly syncs with NetSuite, QuickBooks, and Xero." },
    ],
    ethicsRules: ["Never imply Ledgerly provides tax or legal advice", "No unverifiable ROI guarantees"],
    formats: [
      { format: "article", minWords: 900, maxWords: 1600, structureNotes: "Intro problem, 3–4 H2 sections, close with a concrete next step." },
      { format: "how_to", minWords: 700, maxWords: 1300, structureNotes: "Numbered steps, one action per step, a short why." },
      { format: "faq_page", minWords: 500, maxWords: 1000, structureNotes: "6–10 Q&A pairs, answer-first." },
    ],
  },

  rooted: {
    name: "Rooted",
    siteUrl: "https://rooted.example",
    whatTheyDo: "Rooted makes adaptogenic herbal blends that help busy people wind down in the evening without caffeine or melatonin.",
    differentiator: "Third-party tested single-origin herbs, formulated by clinical herbalists, not a flavor lab.",
    icp: {
      who: "Health-curious professionals aged 28–45 who struggle to switch off at night.",
      segments: ["Wellness-forward millennials", "Ex-melatonin users"],
      geographies: ["United States", "United Kingdom"],
      painPoints: ["Racing mind at bedtime", "Grogginess from sleep aids", "Skeptical of wellness hype"],
      searchBehaviour: "They research ingredients and evidence before buying; they distrust miracle claims.",
    },
    competitors: [{ url: "https://moonjuice.com", name: "Moon Juice" }],
    voice: {
      pillars: [
        { name: "Warm", description: "Speaks like a knowledgeable friend." },
        { name: "Grounded", description: "Evidence over excitement." },
        { name: "Sensory", description: "Evokes the evening ritual." },
      ],
      personality: [
        { is: "Nurturing", notBut: "preachy" },
        { is: "Honest", notBut: "clinical" },
      ],
      principles: ["Never promise a cure", "Name the herb and what it does", "Respect the reader's intelligence"],
      locale: "en-US",
      headlineStyle: "Sentence case, calm, benefit-led.",
    },
    vocabulary: {
      preferredVerbs: ["unwind", "settle", "steep"], preferredNouns: ["ritual", "blend", "evening"], preferredAdjectives: ["calming", "single-origin"],
      terminology: [
        { use: "evening ritual", never: ["bedtime routine", "sleep hack"] },
        { use: "blend", never: ["potion", "elixir"] },
      ],
      banned: ["detox", "miracle", "cure", "toxins", "cleanse"],
    },
    values: [
      { name: "Transparency", description: "Every ingredient and its source is disclosed." },
      { name: "Evidence", description: "Claims are grounded in real herbal research." },
    ],
    approvedFacts: [
      { topic: "testing", fact: "Every Rooted batch is third-party tested for purity." },
      { topic: "ingredients", fact: "Rooted blends contain no melatonin or added caffeine." },
    ],
    ethicsRules: ["Never make medical or disease claims", "No before/after health promises"],
    formats: [
      { format: "article", minWords: 800, maxWords: 1400, structureNotes: "Warm intro, ingredient-led sections, a gentle close." },
      { format: "listicle", minWords: 700, maxWords: 1200, structureNotes: "Numbered list, each item a short evocative paragraph." },
      { format: "testimonial", minWords: 500, maxWords: 1000, structureNotes: "One person's evening, story-led, no hype." },
    ],
  },

  northpeak: {
    name: "Northpeak",
    siteUrl: "https://northpeak.example",
    whatTheyDo: "Northpeak provides working-capital financing to small businesses, with transparent terms and same-week decisions.",
    differentiator: "Flat, disclosed pricing and a human underwriter on every file — no opaque factor rates.",
    icp: {
      who: "Owners of established small businesses ($1M–$10M revenue) needing flexible working capital.",
      segments: ["Main-street retailers", "Trades and services SMBs"],
      geographies: ["United States"],
      painPoints: ["Banks are slow and say no", "Hidden fees on merchant cash advances", "Cash-flow gaps between invoices"],
      searchBehaviour: "They compare financing options carefully and are wary of predatory lenders.",
    },
    competitors: [{ url: "https://ondeck.com", name: "OnDeck" }],
    voice: {
      pillars: [
        { name: "Trustworthy", description: "Plain, honest, no fine-print tricks." },
        { name: "Clear", description: "Explains money simply." },
        { name: "Respectful", description: "Treats owners as capable adults." },
      ],
      personality: [
        { is: "Straightforward", notBut: "cold" },
        { is: "Reassuring", notBut: "salesy" },
      ],
      principles: ["Disclose real costs up front", "Never pressure", "Explain, do not dazzle"],
      locale: "en-US",
      headlineStyle: "Title Case, plain, benefit-and-terms forward.",
    },
    vocabulary: {
      preferredVerbs: ["fund", "bridge", "qualify"], preferredNouns: ["financing", "working capital", "terms"], preferredAdjectives: ["transparent", "flat"],
      terminology: [
        { use: "financing", never: ["cash advance", "quick cash"] },
        { use: "flat pricing", never: ["factor rate"] },
      ],
      banned: ["guaranteed", "risk-free", "no strings", "easy money"],
    },
    values: [
      { name: "Transparency", description: "Every cost is disclosed before signing." },
      { name: "Fairness", description: "Terms a business owner would accept for themselves." },
    ],
    approvedFacts: [
      { topic: "speed", fact: "Northpeak delivers financing decisions within one week." },
      { topic: "pricing", fact: "Northpeak uses flat, disclosed pricing with no hidden fees." },
    ],
    ethicsRules: ["Never guarantee approval or outcomes", "Always note that financing is subject to underwriting"],
    formats: [
      { format: "article", minWords: 900, maxWords: 1500, structureNotes: "Problem, options compared honestly, clear terms, next step." },
      { format: "how_to", minWords: 700, maxWords: 1200, structureNotes: "Numbered steps to qualify and apply." },
      { format: "faq_page", minWords: 500, maxWords: 1000, structureNotes: "Owner questions, answer-first, terms disclosed." },
    ],
  },
};

export const TASKS: EvalTask[] = [
  // Ledgerly (B2B SaaS)
  { tenant: "ledgerly", format: "article", title: "Why Month-End Close Takes Two Weeks (And How to Get It to Three Days)", coreMessage: "Continuous reconciliation removes the month-end scramble.", targetKeyword: "faster month-end close", source: "Notes from a controller call: close drags because card receipts arrive late, approvals sit in email, and reconciliation is manual. They want real-time visibility and fewer surprises." },
  { tenant: "ledgerly", format: "how_to", title: "How to Set Up Continuous Reconciliation for Company Cards", coreMessage: "A step-by-step to reconcile as spend happens.", targetKeyword: "continuous reconciliation", source: "Product walkthrough: connect cards, set approval rules, auto-match receipts, sync to the GL nightly." },
  { tenant: "ledgerly", format: "faq_page", title: "Spend Management for SaaS Finance Teams: Common Questions", coreMessage: "Answers to the questions controllers ask before switching.", targetKeyword: "spend management software", source: "Sales FAQ: integrations, security, pricing philosophy, migration, how the close works." },
  { tenant: "ledgerly", format: "article", title: "Real-Time Spend Controls: What Finance Actually Needs", coreMessage: "Controls should prevent overspend, not just report it.", targetKeyword: "real-time spend controls", source: "Blog brief: proactive controls vs. after-the-fact reporting, with a NetSuite sync example." },

  // Rooted (DTC wellness)
  { tenant: "rooted", format: "article", title: "What actually helps a racing mind at night", coreMessage: "Certain adaptogens calm the nervous system without sedation.", targetKeyword: "how to calm a racing mind at night", source: "Herbalist interview notes: ashwagandha, lemon balm, and passionflower and how they support winding down; emphasize evidence, avoid overclaiming." },
  { tenant: "rooted", format: "listicle", title: "Five calming herbs for your evening ritual", coreMessage: "A grounded tour of five herbs and what each does.", targetKeyword: "calming herbs for sleep", source: "Ingredient sheet: chamomile, lemon balm, ashwagandha, passionflower, magnolia bark — sourcing and traditional use." },
  { tenant: "rooted", format: "testimonial", title: "How one founder finally switched off after work", coreMessage: "A real evening-ritual story, no hype.", targetKeyword: "wind down after work", source: "Customer story: a startup founder who replaced late-night scrolling with a warm Rooted blend and a short walk." },
  { tenant: "rooted", format: "article", title: "Melatonin left you groggy? Here is a gentler approach", coreMessage: "Why some people react poorly to melatonin and what to try instead.", targetKeyword: "melatonin alternatives", source: "Notes: melatonin grogginess, dependence worries; position herbs as a gentler, non-hormonal option; stay within claims." },

  // Northpeak (fintech)
  { tenant: "northpeak", format: "article", title: "Working Capital Options for Small Businesses, Compared Honestly", coreMessage: "An even-handed comparison of financing options and their true costs.", targetKeyword: "small business working capital", source: "Brief: compare bank loans, lines of credit, merchant cash advances, and term financing; disclose real costs; no pressure." },
  { tenant: "northpeak", format: "how_to", title: "How to Qualify for Small Business Financing in a Week", coreMessage: "The steps and documents to get a fast, fair decision.", targetKeyword: "qualify for small business financing", source: "Underwriting checklist: revenue history, bank statements, time in business, what speeds a decision." },
  { tenant: "northpeak", format: "faq_page", title: "Small Business Financing: Owner Questions, Answered", coreMessage: "Straight answers about terms, costs, and timing.", targetKeyword: "small business financing", source: "FAQ: how pricing works, repayment, what happens if revenue dips, underwriting, hidden fees (there are none)." },
];

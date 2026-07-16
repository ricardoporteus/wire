# Wire — Project Plan (v2)
**Product:** Wire — the content engine for CMOs at funded scale-ups
**Prepared:** 16 July 2026 · Supersedes v1 (content-engine-saas-project-plan.md)
**Status:** Planning. Stage 0 decisions locked below.

---

## 0. Decisions locked

| Decision | Answer |
|---|---|
| Name | **Wire** |
| Mavrix relationship | **Fully standalone.** No brand or business connection. The only carry-over is engineering patterns (the ingestion/agent stack, Clerk/Neon/Drizzle architecture) — invisible to customers |
| Pricing model | **Tiered usage-based, all products included in every tier.** Tiers differ by generation credits, Brand Brains, and seats — never by features. Full recommendation in §5 |
| Design system | **SyncMaster** (Framer template — syncmaaster.framer.website). Full token extraction already done in the July 13 session |
| Accent | **Sky blue**, swapped in as the single `--accent` token |

---

## 1. What we're building

A subscription SaaS that replaces the content-team-plus-SEO-agency stack for CMOs at Series A/B funded companies. The thesis: AI content is bad because the brief is bad. Everyone has the same models; almost nobody has live keyword intelligence, an enforced brand voice system, and an editorial standard sitting in front of the model. Wire is that system — a research-and-write engine, not a writing tool.

### The four tools (every tier gets all of them)

1. **SEO Intelligence** — productized `seo-researcher` skill. Analyses the customer's keywords and competitors, runs monthly automated research (keywords, competitor content analysis, content gaps, AEO/People-Also-Ask opportunities, trends), and produces an audited monthly content plan with 8–12 prioritized suggestions.
2. **Content Writer** — productized `content-writer` skill. Universal ingestion (pasted text, transcripts, voice notes, podcast/video links, web article URLs, PDFs, docs) → output format selection (blog article, listicle, how-to, lesson, tutorial, testimonial, FAQ) → generation grounded against the tenant's live SEO Intelligence data and Brand Brain, with the diagnosis-before-writing step as the signature UX.
3. **Repurposer / Exporter** — one long-form piece out to LinkedIn article, condensed LinkedIn post, social captions, newsletter block, plus markdown/HTML/docx export with meta description and alt text.
4. **Publishing connections** — Webflow, WordPress, HubSpot, Ghost. **Deferred to the final phase** by design; exports carry customers until then.

Future fifth tool (noted, not scoped): a performance loop — rank tracking and published-content performance feeding back into the next monthly intelligence run.

---

## 2. Asset inventory — what carries over

| Asset | Source | State | Role in Wire |
|---|---|---|---|
| `seo-researcher` skill | This project | Working, hard-coded to Boundless | Tool 1's agent pipeline once parameterized per tenant |
| `content-writer` skill | This project | Working, hard-coded to Boundless | Tool 2's agent pipeline once parameterized per tenant |
| **SyncMaster design system** | July 13 session (uploaded `SyncMaster_-_Multi-layout_SaaS___Startup_Template.html`) | Fully extracted: warm off-white `#FAF8F4`, card white, deep-green ink `#102D23`, ink-deep `#0A0915`, muted `#52525A`, cream `#FFECD3`, green `#60D184`, red `#F93C3F`, line `#E7E4DD`, radii 24/16px, pill buttons (100px), Figtree display + Inter body, eyebrow-pill + heading section rhythm | The entire UI system, app and marketing site. Accent `#DBFE7A` → **sky blue** (proposed `#A5D8FF`; keeps the light-fill-with-dark-ink contrast pattern — verify in Stage 1). Re-uploading the template HTML gives full component fidelity; otherwise I rebuild from extracted tokens |
| SaaS architecture patterns | Mavrix builds (engineering only) | Full blueprint: Next.js + TypeScript, Neon/Drizzle, Clerk, tier-gated server components, background pipelines, Resend | The chassis, made multi-tenant |
| Model eval harness | June 14 session | Working blind A/B harness with cost/latency reporting | Content-quality QA rig — the "not AI slop" gate |
| AssemblyAI + Claude transcription pipeline | Intro/Donut + Fireflies work | Proven pattern | Audio/video ingestion in Tool 2 |
| Webflow MCP workflow | Boundless 2.0 sprint | Proven | Basis of the first publishing connector (final phase) |
| ContentJunkie landing page | July 13 session | Deployable HTML already built in the SyncMaster system | Direct starting point for the Wire marketing site — rename, re-accent, re-copy |
| Launch economics modelling | June 16 session | Interactive model | GTM reference; hard rule carried over: **no lifetime deals** on a token-burning product |

**Billing platform confirmed:** Clerk (the name you were reaching for). Clerk Billing handles plans, subscriptions, org-level B2B billing, free trials, and a drop-in `<PricingTable />`, with Stripe purely processing payments underneath — no Stripe Billing build. Caveats: still Beta (pin SDK versions) and no native usage metering yet, so Wire's credit system lives in our own database.

---

## 3. The multi-tenant reframe — the Brand Brain

Both skills are excellent single-tenant agents hard-wired to Boundless. Wire is what happens when every hard-coded section becomes per-customer configuration:

- Company profile, differentiator, site URL
- ICP definition (who, role/income, geographies, pain points, search behaviour)
- Competitor list (3–8 URLs)
- Voice pillars and personality contrasts ("confident but not arrogant")
- Approved vocabulary and mandatory terminology table (use this / never this)
- Brand values, approved facts, content ethics rules
- Enabled formats and length rules

The Boundless skills prove the schema — they *are* a filled-in Brand Brain. Onboarding is a guided wizard with an AI assist that drafts the Brand Brain from the customer's website and any uploaded brand doc. This is also the moat: a customer invested in their Brand Brain doesn't churn to a generic tool. The `seo-intelligence.md` output becomes per-tenant database records (keywords, AEO questions, gaps, competitor intel, monthly ideas), refreshed on a scheduled run, rendered as a dashboard, and still exportable as the report a CMO forwards internally.

---

## 4. Technical architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript + RSC | Current standard; matches proven patterns |
| UI | Tailwind v4 themed with SyncMaster tokens; shadcn/ui primitives restyled | Tokens extracted; accent swap is one line |
| Auth + SSO | Clerk — Google/Microsoft SSO, magic link, Organizations | One org = one customer = one-or-more Brand Brains |
| Billing | Clerk Billing (org plans, `<PricingTable />`, `has()` gating; Stripe underneath) | Minimal billing code, one vendor with auth |
| Database | Neon Postgres + Drizzle ORM | Serverless, branchable for dev |
| AI | Anthropic API — Sonnet 4.6 default generation, Opus 4.8 for the monthly research run; eval harness decides final assignments (Fable 5 candidate for the agentic research loop) | Bake-off finding: biggest jump is Sonnet→Opus; premium models only where agentic work earns it |
| Background jobs | Inngest (or Trigger.dev) | Monthly runs and transcriptions need steps, retries, cron |
| Ingestion | URL fetch + readability extraction; PDF/doc parsing; AssemblyAI for audio/video/podcast links | Reuses the proven pipeline |
| Email | Resend | Transactional + run-complete notifications |
| Hosting | Vercel | Default for the stack |
| Observability | Sentry + per-tenant token/cost ledger | Token cost is COGS; visible from day one |

---

## 5. Pricing — market comparison and recommendation

### The market, July 2026

**Layer 1 — point tools ($15–130/mo).** Frase $49–129, Scalenut $39–149, Surfer $89–219 (30–100 articles in editor, optimization only), NeuronWriter from $19, Writesonic $16–99 solo. These are single-job tools: they optimize *or* draft, and every one requires the CMO to assemble the rest of the stack around them.

**Layer 2 — premium content platforms ($129–500/mo).** Clearscope $129 Essentials / $399 Business (optimization + briefs, unlimited users); Writesonic team plans $199–399; MarketMuse pulled public pricing in 2026 and moved to enterprise sales (legacy tiers ran $99–499+, annual deals ~$5–7k). Strong at one layer (optimization or strategy), none of them write finished on-brand content end-to-end.

**Layer 3 — team AI writing ($900+/mo).** Jasper Business is custom, typically from ~$900/month for small teams — and still requires a separate Surfer subscription for SEO, so the real per-seat cost of Jasper-for-SEO runs ~$158+/seat before strategy or repurposing.

**Layer 4 — the thing Wire actually replaces.** Content agencies at $10k–30k/month, or freelancers at $50–150 per article plus a strategist. This is where Series A/B CMOs currently spend.

### Where Wire sits

Wire deliberately does not fight in Layer 1. A $49 price tag says "another tool"; the positioning is "the stack" — strategy (MarketMuse's job) + optimization (Surfer/Clearscope's job) + on-brand writing (Jasper's job) + repurposing, in one engine. The credible comparison for the buyer is Layer 3 + Layer 4 spend, and the pricing should sit just under the Jasper-Business anchor while being an order of magnitude under agencies.

### Recommended tiers — usage-based, all products in every tier

Credits are the single usage unit (long-form article ≈ 20 credits, repurpose pack ≈ 5, monthly intelligence run ≈ 100 — tune against measured token COGS in Stage 6; target COGS under ~12% of plan price).

| | **Launch — $299/mo** | **Growth — $799/mo** (hero tier) | **Scale — $1,995/mo** |
|---|---|---|---|
| Brand Brains | 1 | 2 | 5 |
| Seats | 3 | 10 | Unlimited |
| Credits/mo | 500 (~15 articles + monthly run) | 1,400 (~45 articles + runs) | 4,000 (~130 articles + runs) |
| Intelligence runs | Monthly | Monthly + on-demand | Weekly + on-demand |
| Extras | — | Priority generation | API + connectors first, white-glove onboarding, agency use permitted |
| Effective cost/article | ~$20 | ~$18 | ~$15 |

Top-ups: $99 per 300 credits. Annual: 2 months free. **Trial:** 14 days with a real (credit-capped) intelligence run on the prospect's own domain — the live-demo close, self-serve. **No free tier, no lifetime deals** (the June modelling showed forever-deals on a token-burning product are a serving-cost liability).

The sales math that closes CMOs: Growth at $799/month produces ~45 audited, on-brand, SEO-grounded articles — under $20 each against $50–150 freelance drafts (unbriefed) or $200–500+ agency articles. A $9,600/year line item replacing a $120k–360k/year agency retainer or a content hire. Validate all numbers on the Stage 0 calls before locking; price is the cheapest variable to test.

---

## 6. Build stages

### Stage 0 — Validation frame (week 0) · *mostly resolved*
Name, positioning, pricing hypothesis: done (above). Remaining: domain acquisition, and **10 CMO calls** from your network with the live demo close — run the research agent against their domain on the call. Honest gate before heavy build. Write the proof claim down now: *every page of Wire's marketing site is written by Wire.*

### Stage 1 — Foundation (weeks 1–2)
Repo + Next.js + TypeScript scaffold. SyncMaster Tailwind v4 theme installed with sky-blue accent (`--accent: #A5D8FF` proposed; contrast-check against ink `#102D23` in fills, pills, and focus states — re-upload the template HTML for full component fidelity). Clerk auth with Google/Microsoft SSO and Organizations. Clerk Billing configured with the three plans and feature slugs; gating via `has()`. Neon + Drizzle schema v1: `organizations`, `brand_brains`, `intelligence_runs`, `keywords`, `content_ideas`, `sources`, `documents`, `exports`, `usage_ledger`. Deployed skeleton on Vercel.

### Stage 2 — Brand Brain onboarding (weeks 2–3)
Guided wizard + "draft it for me" AI assist (scrapes their site, proposes ICP/voice/terminology, user edits and approves). Brand Brain editor. This is the productization of everything hard-coded in the two skills — get the schema right here and Stages 3–4 are plumbing.

### Stage 3 — Tool 1: SEO Intelligence (weeks 3–5)
Port `seo-researcher` into an Inngest multi-step agentic pipeline: keyword research → competitor analysis → gap analysis → AEO opportunities → trends → best-practice refresh → structured DB write. On-demand first run at onboarding; monthly cron after. Dashboard: priority keyword tables, AEO clusters, competitor cards, gap list, and the ranked "Recommended Content This Month" queue with one-click "Write this" handoff to Tool 2. Report export.

### Stage 4 — Tool 2: Content Writer (weeks 5–7)
Ingestion pipeline (paste / upload / URL / audio-video → normalized source text). Format selector. Two-phase flow preserved as UX: **Diagnosis card** (core message, recommended format + title, target keyword pulled live from the tenant's intelligence data, target AEO question, alternative option) → confirm → full generation with Brand Brain enforced. Clean editor with the content brief panel (keywords, meta, alt text, voice/terminology checks). Regenerate-section and tone controls. Every generation decrements the ledger.

### Stage 5 — Tool 3: Repurposer & exports (weeks 7–8)
LinkedIn article, condensed LinkedIn post, platform captions, newsletter block; markdown/HTML/docx export. Cheap to build, high perceived value — the demo moment that lands with CMOs.

### Stage 6 — Hardening & commercial plumbing (weeks 8–9)
Credit enforcement + in-app balance + upgrade prompts. Internal per-tenant cost dashboards; calibrate credit values against measured token COGS. Rate limiting, Sentry, audit logging. Prompt-injection hygiene: all ingested web/PDF/audio content is data, never instructions. Legal set: ToS, privacy, DPA, AI-content disclosure. Quality gate: eval harness on 20 real generations across 3 synthetic tenants — pass/fail for launch.

### Stage 7 — Marketing site & launch surface (weeks 9–10)
Wire landing page evolved from the ContentJunkie build (already in the SyncMaster system): rename, sky-blue accent, proof strip up top (*this site is written by Wire*), pricing via Clerk `<PricingTable />`, three real sample outputs — the page collapses without them. All marketing pages written by the product.

### Stage 8 — GTM (weeks 10–12+)
Five to ten design partners from your CMO network at founder pricing; case study each. Then public: LinkedIn build-in-public (the Operator's Channel framework fits exactly), Product Hunt using the June playbook, no lifetime deals.

### Stage 9 — Publishing connections (post-launch)
Webflow first (MCP workflow proven), then WordPress, HubSpot, Ghost. One-click publish with meta fields mapped. Deliberately last, per your instruction.

---

## 7. Risks

Crowded category — the positioning must stay *research-first engine with a Brand Brain*, never "AI writing tool"; the $299 floor is part of that signal. Quality is the whole thesis — the eval harness and the dogfooded marketing site are the guardrails; if output reads like slop the product is evidence against itself. Token COGS — credits and cost telemetry from day one. And the pattern flagged in the Mavrix sessions: beautiful build-outs that never ask for money. The ten calls come before the repo. That ordering remains the most important line in this plan.

---

## 8. Immediate next actions

1. Re-upload `SyncMaster_-_Multi-layout_SaaS___Startup_Template.html` here (full component fidelity) — or I rebuild the theme from the extracted tokens.
2. Confirm or adjust the sky-blue value (proposed `#A5D8FF`; I can mock 3 candidates against the SyncMaster palette in one screen).
3. Sanity-check the three price points — then test them on the calls, not in the spreadsheet.
4. I draft the Brand Brain schema (Drizzle + onboarding wizard spec) — the keystone everything else reads from.
5. Book the first five CMO calls.

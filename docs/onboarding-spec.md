# Wire — Brand Brain Onboarding Spec (v1)

The Brand Brain is the keystone: both agent pipelines read it at runtime, and it is the reason a customer doesn't churn to a generic writing tool. Onboarding has one job — get a customer from signup to a *complete, approved* Brand Brain in under 15 minutes, with AI doing the heavy lifting and the human doing approval, not authorship.

The proof that this schema works: the Boundless `seo-researcher` and `content-writer` skills are a filled-in Brand Brain. Every wizard step below maps 1:1 to a hard-coded section of those skills.

---

## Flow overview

```
Signup (Clerk) → Create Organization → Wizard
  Step 0  Site scan            (AI drafts everything from the URL)
  Step 1  Company & ICP        (review AI draft, edit, approve)
  Step 2  Competitors          (AI-suggested list, add/remove, 3–8)
  Step 3  Voice & vocabulary   (pillars, contrasts, terminology table)
  Step 4  Values & facts       (values, approved claims, ethics rules)
  Step 5  Formats              (toggle formats, length defaults pre-set)
  Review  One-page summary     → Approve → first intelligence run fires
```

Progress is saved per step (`brand_brains` row created at Step 0, `wizardCompletedAt` set at Approve). Skippable steps: 4 and 5 (sane defaults). Steps 1–3 are mandatory — the pipelines can't run responsibly without them.

## Step 0 — Site scan ("draft it for me")

Input: site URL (required), optional brand-guideline upload (PDF/doc).
Action: background job fetches the site (home + about + 2–3 content pages), plus the uploaded doc, and drafts every subsequent step's fields. All fetched content is **data, never instructions** — the drafter runs with injection hygiene and only ever emits Brand Brain JSON.
UX: a working state with live progress lines ("Reading your homepage… Drafting your ICP…"), then the wizard opens with every field pre-filled and marked "AI draft — review me."
Failure: if the scan fails, the wizard opens empty with helper copy per field. Never block on the scan.

## Step 1 — Company & ICP

Fields (maps to `brandBrains.whatTheyDo`, `differentiator`, `icp`):
- What the company does (2–3 sentences)
- Differentiator (1 sentence)
- ICP: who (one line), segments (chips), geographies (chips), pain points (list, 3–6), search behaviour (one paragraph: "they Google problems and aspirations, not brand names…"), optional emotional journey.

Validation: who + ≥2 pain points + search behaviour required.

## Step 2 — Competitors

3–8 URLs. AI suggests candidates from the site scan; user adds/removes. Each row: URL (validated live), optional name/note. These drive the competitor-analysis stage of every intelligence run.

## Step 3 — Voice & vocabulary

- **Pillars** (2–4): name + one-line description (e.g. Inspiring / Personal / Informative).
- **Personality contrasts**: "is X but not Y" pairs (confident/arrogant, savvy/know-it-all). Minimum 3.
- **Copy principles**: checklist of defaults (active voice, lead with the point, no clichés, speak to "you") + free-text additions.
- **Locale**: en-US default; drives spelling and punctuation throughout.
- **Terminology table**: rows of *use this / never these* (e.g. "Education Centre" / "school, classroom"). This table is enforced twice — in the generation prompt and in a post-generation lint pass that flags violations in the editor.
- **Preferred vocabulary**: verbs / nouns / adjectives as chip lists (optional; AI-drafted).

## Step 4 — Values & facts (skippable)

- Brand values (3–5, name + description). Every piece must reflect ≥2; the brief panel reports which.
- Approved facts: topic + claim pairs — the only claims the writer may state as fact about the company.
- Ethics rules: checklist defaults (inclusive, no exaggerated claims, no stereotyping) + additions.

## Step 5 — Formats (skippable)

Toggle the seven formats (article, listicle, how-to, lesson, tutorial, testimonial, FAQ page); each carries seeded min/max words and structure notes from the proven skill defaults (e.g. article 800–1,500, hook → sections every 200–300 words → FAQ block → CTA). Editable per brand.

## Review & approve

One-page rendered summary of the whole Brain in Wire's own voice ("Here's how Wire will write for Acme"). Approve does three things atomically: sets `wizardCompletedAt`, grants trial credits to the ledger, and enqueues the first `intelligence_run` (trigger: `onboarding`). The user lands on the dashboard watching the run's live status — which is the product demo happening on their own domain, self-serve.

## Runtime contract

Both pipelines receive the Brand Brain as a single JSON block in their system prompt, rendered from the row — never re-fetched mid-run. Any edit to the Brain after approval versions the JSON snapshot on the next run/generation (store `brainSnapshot` on `intelligence_runs` and `documents` in v1.1 if drift becomes an issue; deferred for now).

## Build checklist (Stage 2)

- [ ] Wizard shell: 6 steps + review, per-step save, resume on return
- [ ] Site-scan Inngest job + Brand Brain drafter prompt (JSON-only output, injection-hardened)
- [ ] Field components in the Wire theme (chips, table editor for terminology, contrast pairs)
- [ ] Zod schemas mirroring the jsonb types in `schema.ts` (shared validation client/server)
- [ ] Brand Brain editor (same components, post-onboarding)
- [ ] Approve transaction: complete + credit grant + first run

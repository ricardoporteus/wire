# Wire

The content engine for CMOs. Research-first: live SEO intelligence per brand,
a Brand-Brain-trained writer, channel repurposing — replacing the content-team
+ SEO-agency stack for Series A/B companies.

Stack: Next.js (App Router) · TypeScript · Tailwind v4 (SyncMaster tokens,
sky accent) · Clerk (auth + billing) · Neon + Drizzle · Inngest · Anthropic API
· AssemblyAI · Resend · Vercel.

Start here: `claude-code-kickoff.md` — then `docs/project-plan.md`.

Quick start:
  npm i
  cp .env.example .env.local   # fill in
  npm run db:generate && npm run db:migrate
  npm run inngest:dev          # terminal 2
  npm run dev

/**
 * Homepage — the SyncMaster "home-02" layout rebuilt in this app's design system,
 * selling Wire.
 *
 * All copy lives in ./content.ts. The interactive parts (feature tabs, pricing
 * toggle, count-up stats) live in ./Interactive.tsx as client components.
 *
 * Three sections deliberately differ from the template, because the template's
 * versions would have been untrue for Wire: the customer logo wall is now the
 * six research stages, the customer-outcome stats are now product facts, and the
 * third party integration logos are now the export formats Wire really produces.
 * The award badges are gone for the same reason.
 *
 * Images in /public/syncmaster are still template placeholders. Replace before
 * launch.
 */
import Image from "next/image";
import {
  ASSETS, NAV, HERO, STAGE_STRIP, FEATURES, TOOLS, SPLITS,
  PRICING, STATS, CHANNELS, CTA, FOOTER,
} from "./content";
import { FeatureTabs, PricingToggle, Stats } from "./Interactive";
import { FeedPanel } from "./FeedPanel";

export function HomePage({ appUrl }: { appUrl: string }) {
  const app = `${appUrl}/dashboard`;

  return (
    <div className="bg-bg">
      {/*
        Landmarks: header / main / footer are siblings, so assistive tech can skip
        straight to the content. The dark field used to be one wrapper div around
        both the header and the hero, which left the document with no <main> at
        all. It is now split: the header carries its own dark background, and the
        hero opens <main>.
      */}
      <header className="relative z-10 border-b border-white/10 bg-hero">
          <div className="mx-auto flex max-w-[1200px] items-center gap-10 px-6 py-5">
            {/* Text wordmark, matching the app shell. The template's logo asset is
                SyncMaster's own branding and cannot be used here. */}
            <a href="/" className="font-display text-h5 font-semibold text-white">Wire</a>
            <nav className="hidden items-center gap-8 lg:flex">
              {NAV.map((n) => (
                <a key={n.label} href={n.href} className="text-body-sm text-white/85 hover:text-white">
                  {n.label}
                </a>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-4">
              <a href={app} className="hidden text-body-sm text-white/85 hover:text-white sm:block">Sign in</a>
              <a
                href={app}
                className="rounded-pill bg-lime px-6 py-3 font-display text-[15px] font-semibold text-ink-green transition hover:bg-lime-soft"
              >
                {HERO.primary}
              </a>
            </div>
          </div>
      </header>

      <main>
        {/* ================= Hero (dark field) ============================= */}
        <section className="relative overflow-hidden bg-hero">
          <div aria-hidden className="hero-grid pointer-events-none absolute inset-0" />
          <div className="relative z-10 mx-auto grid max-w-[1200px] items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:pb-28 lg:pt-24">
          <div>
            <a href="#features" className="inline-flex items-center gap-3 rounded-pill bg-white/10 p-1.5 pr-4 backdrop-blur">
              <span className="rounded-pill bg-lime px-3 py-1 font-display text-[13px] font-semibold text-ink-green">
                {HERO.tagNew}
              </span>
              <span className="text-caption text-white">{HERO.tagText}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-white/15 text-[11px] text-white" aria-hidden>↗</span>
            </a>

            <h1 className="mt-7 max-w-xl text-h3 text-white md:text-display-xl">
              {HERO.title}
              <Image
                src={ASSETS.headlineArrow}
                alt=""
                width={70}
                height={44}
                className="ml-3 inline-block h-8 w-auto align-baseline md:h-11"
              />
            </h1>

            <p className="mt-6 max-w-md text-body text-white/70">{HERO.body}</p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={app}
                className="rounded-pill bg-lime px-7 py-4 font-display text-[15px] font-semibold text-ink-green transition hover:bg-lime-soft"
              >
                {HERO.primary}
              </a>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-pill border border-white/25 px-7 py-4 font-display text-[15px] font-semibold text-white transition hover:bg-white/10"
              >
                {HERO.secondary} <span aria-hidden>›</span>
              </a>
            </div>
          </div>

          {/* The live run feed, replacing the template's email-app composite: it
              shows Wire's actual product rather than a stock screenshot. The
              template's doodle arrows are gone; against a single clean card they
              read as artefacts rather than decoration. */}
          <div className="mx-auto w-full max-w-[560px]">
            <FeedPanel />
          </div>
          </div>
        </section>

      {/* ========= Stage strip (was: fabricated customer logo wall) ========= */}
      <section className="mx-auto max-w-[1200px] px-6 py-section-sm">
        <p className="text-center text-body text-muted">{STAGE_STRIP.title}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {STAGE_STRIP.stages.map((s, i) => (
            <span
              key={s}
              className="inline-flex items-center gap-2 rounded-pill border border-line bg-card px-5 py-2.5 text-body-sm text-ink-green"
            >
              <span className="font-display text-caption font-semibold text-accent-ink">
                {String(i + 1).padStart(2, "0")}
              </span>
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ================= Features with tabs =============================== */}
      <section id="features" className="mx-auto max-w-[1200px] px-6 pb-section-sm">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-body-sm text-muted">{FEATURES.eyebrow}</p>
            <h2 className="mt-3 max-w-lg text-h4 md:text-h2">{FEATURES.title}</h2>
          </div>
          <FeatureTabs />
        </div>
      </section>

      {/* ================= Three steps ===================================== */}
      <section id="how" className="mx-auto max-w-[1200px] px-6 pb-section-sm">
        <div className="text-center">
          <p className="text-body-sm text-muted">{TOOLS.eyebrow}</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-h4 md:text-h2">{TOOLS.title}</h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TOOLS.cards.map((c, i) => (
            <a key={c.title} href={app} className="group relative block overflow-hidden rounded-lg">
              <Image src={c.img} alt="" width={640} height={760} sizes="(max-width: 768px) 94vw, 384px" className="h-[420px] w-full object-cover transition duration-500 group-hover:scale-105" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/15 to-black/50" />
              <span className="absolute left-7 top-7 flex h-9 w-9 items-center justify-center rounded-pill bg-lime font-display font-semibold text-ink-green">
                {i + 1}
              </span>
              <h3 className="absolute left-7 right-7 top-20 text-h5 text-white">{c.title}</h3>
              <span className="absolute bottom-7 left-7 inline-flex items-center gap-2 rounded-pill bg-white/95 px-5 py-2.5 font-display text-[14px] font-semibold text-ink-green">
                {c.cta} <span aria-hidden>›</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ================= Alternating splits =============================== */}
      {SPLITS.map((s) => (
        <section key={s.title} className="mx-auto max-w-[1200px] px-6 pb-section-sm">
          <div className="grid items-center gap-12 rounded-lg bg-bg-alt p-8 md:grid-cols-2 md:p-14">
            <div className={s.flip ? "md:order-2" : ""}>
              <div className="relative">
                <Image src={s.img} alt="" width={620} height={420} sizes="(max-width: 768px) 94vw, 560px" className="w-full rounded-md shadow-card" />
                <Image src={s.imgAlt} alt="" width={300} height={130} sizes="(max-width: 768px) 48vw, 290px" className="absolute -bottom-6 -right-4 w-[52%] rounded-md shadow-card" />
              </div>
            </div>

            <div className={s.flip ? "md:order-1" : ""}>
              <h2 className="max-w-md text-h4 md:text-h3">{s.title}</h2>
              <p className="mt-4 max-w-md text-body-sm text-muted">{s.body}</p>

              <p className="mt-8 font-display text-h5 text-ink-green">{s.listTitle}</p>
              <ul className="mt-4 space-y-3">
                {s.list.map((li) => (
                  <li key={li} className="flex items-center gap-3">
                    <Image src={ASSETS.iconBullet} alt="" width={22} height={22} className="h-5 w-5 shrink-0" />
                    <span className="text-body-sm text-ink">{li}</span>
                  </li>
                ))}
              </ul>

              <a href={app} className="mt-8 inline-flex items-center gap-2 rounded-pill bg-hero px-7 py-3.5 font-display text-[15px] font-semibold text-white">
                {s.cta} <span aria-hidden>›</span>
              </a>
            </div>
          </div>
        </section>
      ))}

      {/* ================= Pricing (chartreuse field) ======================= */}
      <section id="pricing" className="bg-lime">
        <div className="mx-auto max-w-[1200px] px-6 py-section-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-body-sm text-ink-green/70">{PRICING.eyebrow}</p>
              <h2 className="mt-3 text-h4 md:text-h2">{PRICING.title}</h2>
              <p className="mt-3 max-w-xl text-body-sm text-ink-green/70">{PRICING.note}</p>
            </div>
            <PricingToggle appUrl={appUrl} />
          </div>
        </div>
      </section>

      {/* ============ Stats (was: fabricated customer outcomes) ============ */}
      <section className="mx-auto max-w-[1200px] px-6 py-section-sm">
        <div className="text-center">
          <p className="text-body-sm text-muted">{STATS.eyebrow}</p>
          <h2 className="mt-3 text-h4 md:text-h2">{STATS.title}</h2>
        </div>
        <Stats />
      </section>

      {/* ========= Channels (was: third party integration logos) =========== */}
      <section className="mx-auto max-w-[1200px] px-6 pb-section-sm">
        <div className="grid items-center gap-12 rounded-lg bg-bg-alt p-8 md:grid-cols-2 md:p-14">
          <div>
            <h2 className="max-w-md text-h4 md:text-h3">{CHANNELS.title}</h2>
            <p className="mt-4 max-w-md text-body-sm text-muted">{CHANNELS.body}</p>
            <a href={app} className="mt-8 inline-flex items-center gap-2 rounded-pill bg-hero px-7 py-3.5 font-display text-[15px] font-semibold text-white">
              {CHANNELS.cta} <span aria-hidden>›</span>
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {CHANNELS.items.map((c) => (
              <div key={c.name} className="rounded-md bg-card p-5 shadow-card">
                <p className="font-display text-h5 text-ink-green">{c.name}</p>
                <p className="mt-1 text-caption text-muted">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Closing CTA (dark field, closes main) =========== */}
      <section className="bg-hero">
        <div className="mx-auto max-w-[1200px] px-6 py-section-sm text-center">
          <h2 className="mx-auto max-w-xl text-h4 text-white md:text-h2">{CTA.title}</h2>
          <p className="mx-auto mt-4 max-w-md text-body-sm text-white/70">{CTA.body}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href={app} className="rounded-pill bg-lime px-7 py-4 font-display text-[15px] font-semibold text-ink-green transition hover:bg-lime-soft">
              {CTA.primary}
            </a>
            <a href="#pricing" className="inline-flex items-center gap-2 rounded-pill border border-white/25 px-7 py-4 font-display text-[15px] font-semibold text-white transition hover:bg-white/10">
              {CTA.secondary} <span aria-hidden>›</span>
            </a>
          </div>
        </div>
      </section>
      </main>

      <footer className="border-t border-white/10 bg-hero">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-display text-h5 font-semibold text-white">Wire</p>
              <p className="mt-5 max-w-xs text-body-sm text-white/60">{FOOTER.body}</p>
            </div>

            {FOOTER.columns.map((col) => (
              <div key={col.title}>
                <p className="font-display text-caption font-semibold tracking-wide text-white/50">{col.title}</p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href.startsWith("/") && !l.href.startsWith("/legal") ? `${appUrl}${l.href}` : l.href}
                        className="text-body-sm text-white/80 hover:text-white"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mx-auto max-w-[1200px] border-t border-white/10 px-6 py-6">
            <p className="text-caption text-white/50">© {new Date().getFullYear()} {FOOTER.copyright}</p>
          </div>
      </footer>

      <style>{`
        .hero-grid {
          background-image:
            linear-gradient(to right, rgba(219,254,122,.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(219,254,122,.07) 1px, transparent 1px);
          background-size: 62px 62px;
          transform: perspective(700px) rotateX(52deg) scale(1.9);
          transform-origin: top center;
          mask-image: linear-gradient(to bottom, #000 10%, transparent 78%);
          -webkit-mask-image: linear-gradient(to bottom, #000 10%, transparent 78%);
        }
      `}</style>
    </div>
  );
}

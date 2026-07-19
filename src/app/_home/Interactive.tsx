"use client";

/**
 * The three interactive pieces of the homepage: the feature tab switcher, the
 * pricing billing toggle, and the count-up stats. Everything else on the page is
 * static and stays a server component.
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FEATURES, PRICING, STATS, ASSETS } from "./content";

/* -------------------------------------------------------------------------- */
/* Feature tabs                                                               */
/* -------------------------------------------------------------------------- */

export function FeatureTabs() {
  const [active, setActive] = useState(0);
  const tab = FEATURES.tabs[active];

  return (
    <>
      <div
        role="tablist"
        aria-label="How Wire works"
        className="inline-flex rounded-pill border border-line bg-card p-1.5"
      >
        {FEATURES.tabs.map((t, i) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className="tab"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-10 w-full rounded-lg bg-bg-alt p-8 md:p-12">
        <div className="grid items-center gap-10 md:grid-cols-2">
          {/* Single image per tab: the placeholder screenshots have baked-in
              whitespace, so overlaying a second one just collided with it. */}
          <Image
            key={tab.img}
            src={tab.img}
            alt=""
            width={620}
            height={420}
            sizes="(max-width: 768px) 94vw, 560px"
            className="w-full rounded-md shadow-card"
          />

          <div>
            <h3 className="text-h4 md:text-h3">{tab.panelTitle}</h3>
            <div className="mt-8 space-y-7">
              {tab.items.map((it) => (
                <div key={it.title} className="flex gap-4">
                  <Image src={it.icon} alt="" width={34} height={34} className="mt-1 h-8 w-8 shrink-0" />
                  <div>
                    <h4 className="text-h5">{it.title}</h4>
                    <p className="mt-1.5 max-w-md text-body-sm text-muted">{it.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Pricing                                                                    */
/* -------------------------------------------------------------------------- */

export function PricingToggle({ appUrl }: { appUrl: string }) {
  const [monthly, setMonthly] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 rounded-pill bg-card px-5 py-3 text-body-sm">
        <span className={monthly ? "text-muted" : "font-medium text-ink-green"}>{PRICING.toggle.left}</span>
        <button
          type="button"
          role="switch"
          aria-checked={monthly}
          aria-label="Toggle monthly billing"
          onClick={() => setMonthly((m) => !m)}
          className="relative h-7 w-12 rounded-pill bg-hero transition-colors"
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-pill bg-white transition-all ${monthly ? "left-6" : "left-1"}`}
          />
        </button>
        <span className={monthly ? "font-medium text-ink-green" : "text-muted"}>{PRICING.toggle.right}</span>
      </div>

      <div className="mt-4 w-full text-body-sm text-ink-green/70">
        {monthly ? PRICING.monthlyNote : PRICING.yearlyNote}
      </div>

      <div className="mt-8 grid w-full gap-6 md:grid-cols-3">
        {PRICING.plans.map((p) => {
          const dark = p.featured;
          return (
            <div key={p.name} className={`rounded-lg p-8 ${dark ? "bg-hero text-white" : "bg-card"}`}>
              <h3 className={`text-h4 ${dark ? "text-white" : "text-ink-green"}`}>{p.name}</h3>
              <p className={`mt-1 text-body-sm ${dark ? "text-white/70" : "text-muted"}`}>{p.blurb}</p>

              {/* Credits are the honest headline number until the Clerk prices land. */}
              <div className="mt-6 flex items-baseline gap-2">
                <span className={`font-display text-[44px] font-semibold leading-none ${dark ? "text-white" : "text-ink-green"}`}>
                  {p.credits.toLocaleString()}
                </span>
                <span className={`text-body-sm ${dark ? "text-white/70" : "text-muted"}`}>
                  credits
                  <br />
                  per month
                </span>
              </div>
              <p className={`mt-3 text-caption ${dark ? "text-white/60" : "text-muted"}`}>{p.priceLabel}</p>

              <p className={`mt-7 text-body-sm ${dark ? "text-white/70" : "text-muted"}`}>{p.featuresTitle}</p>
              <hr className={`mt-3 ${dark ? "border-white/15" : "border-line"}`} />

              <ul className="mt-5 space-y-3.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Image
                      src={ASSETS.iconBullet}
                      alt=""
                      width={22}
                      height={22}
                      className={`h-5 w-5 shrink-0 ${dark ? "invert" : ""}`}
                    />
                    <span className={`text-body-sm ${dark ? "text-white" : "text-ink"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={`${appUrl}/billing`}
                className="mt-8 flex items-center justify-between rounded-pill bg-lime px-6 py-3.5 font-display text-[15px] font-semibold text-ink-green transition hover:bg-lime-soft"
              >
                {p.cta}
                <span aria-hidden>›</span>
              </a>
            </div>
          );
        })}
      </div>

      <p className="mt-8 w-full text-body-sm text-ink-green/70">{PRICING.topUp}</p>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Count-up stats                                                             */
/* -------------------------------------------------------------------------- */

function useCountUp(target: number) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion: show the final number, skip the animation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || done.current) return;
        done.current = true;
        const start = performance.now();
        const DURATION = 1400;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / DURATION);
          setN(Math.round(target * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return { n, ref };
}

export function Stats() {
  return (
    <div className="mt-14 space-y-20">
      {STATS.items.map((s, i) => (
        <StatRow key={s.label} stat={s} flip={i % 2 === 1} />
      ))}
    </div>
  );
}

function StatRow({ stat, flip }: { stat: (typeof STATS.items)[number]; flip: boolean }) {
  const { n, ref } = useCountUp(stat.value);

  return (
    <div ref={ref} className="grid items-center gap-10 md:grid-cols-2">
      <div className={flip ? "md:order-2" : ""}>
        <Image
          src={stat.img}
          alt=""
          width={900}
          height={520}
          sizes="(max-width: 768px) 94vw, 560px"
          className="h-[300px] w-full rounded-lg object-cover md:h-[390px]"
        />
      </div>
      <div className={flip ? "md:order-1" : ""}>
        <p className="font-display text-[64px] font-semibold leading-none text-ink-green">
          {n}
          {stat.suffix}
        </p>
        <h3 className="mt-6 text-h4">{stat.label}</h3>
        <p className="mt-2 max-w-sm text-body-sm text-muted">{stat.body}</p>
      </div>
    </div>
  );
}

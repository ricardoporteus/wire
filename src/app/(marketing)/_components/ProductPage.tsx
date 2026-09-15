"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar, type SpecialistId } from "./Avatars";
import { PRODUCTS, type Product } from "./products";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { Starfield } from "./Starfield";

export type ProductData = {
  id: Product["id"];
  avatar: SpecialistId;
  persona: string;
  role: string;
  roleColor: string;
  hero: { title: ReactNode; sub: string; cta: string; mock: ReactNode };
  pains: { old: string[]; fixes: { b: string; chip: string }[] };
  benefits: { ic: string; h: string; p: string }[];
  zigs: { klabel: string; h: string; p: string; bullets: string[]; mock: ReactNode; flip?: boolean }[];
  videoTitle: string;
  spec: { h: string; p: string }[];
  testimonials: { quote: string; ini: string; iniBg: string; role: string }[];
  cases: { co: string; title: string; metrics: { b: string; span: string }[]; problem: string; withText: string; result: string }[];
  faq: { q: string; a: string }[];
  crossIntro: string;
  closing: { h: string; p: string };
};

export function ProductPage({ data }: { data: ProductData }) {
  const others = PRODUCTS.filter((p) => p.id !== data.id);
  return (
    <>
      <SiteNav active={data.id} />

      <section className="hero">
        <Starfield />
        <div className="wrap hero-in">
          <div>
            <span className="pchip"><span className="av"><Avatar id={data.avatar} /></span><b>{data.persona}</b><span>· {data.role}</span></span>
            <h1 className="htitle">{data.hero.title}</h1>
            <p className="sub">{data.hero.sub}</p>
            <div className="cta"><Link className="btn btn-lime" href="/dashboard">{data.hero.cta}</Link><a className="btn btn-ghost" href="#video">Watch the walkthrough ›</a></div>
            <p className="micro">Free to start · No card required</p>
          </div>
          <div>{data.hero.mock}</div>
        </div>
      </section>

      {/* pain killers */}
      <section className="band">
        <div className="wrap">
          <span className="eyebrow sky">Sound familiar?</span>
          <h2 className="sec" style={{ marginTop: 14 }}>The problems {data.persona} takes off your plate</h2>
          <div className="cmp">
            <div className="col old"><div className="ch">✕ Without Mavrix</div>
              <ul>{data.pains.old.map((o) => <li key={o}><span className="m">✕</span><span>{o}</span></li>)}</ul>
            </div>
            <div className="col new"><div className="ch">✓ With {data.persona}</div>
              <ul>{data.pains.fixes.map((f) => <li key={f.b}><span className="m">✓</span><span className="txt"><b>{f.b}</b><span className="fchip">{f.chip}</span></span></li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      {/* benefits */}
      <section className="band" style={{ background: "var(--bg-alt)" }}>
        <div className="wrap center"><span className="eyebrow">Why it matters</span><h2 className="sec" style={{ marginTop: 14 }}>What you get out of it</h2></div>
        <div className="wrap"><div className="bens">
          {data.benefits.map((b) => <div key={b.h} className="ben"><div className="ic">{b.ic}</div><h3>{b.h}</h3><p>{b.p}</p></div>)}
        </div></div>
      </section>

      {/* benefit ↔ feature */}
      <section className="band">
        <div className="wrap">
          <span className="eyebrow mint">How it delivers</span>
          <h2 className="sec" style={{ marginTop: 14 }}>Each benefit, and the feature behind it</h2>
          {data.zigs.map((z, i) => (
            <div key={z.h} className={`zig${z.flip ? " flip" : ""}`} style={{ marginTop: i === 0 ? 36 : 44 }}>
              <div className="zt"><div className="klabel">{z.klabel}</div><h3>{z.h}</h3><p>{z.p}</p>
                <ul>{z.bullets.map((li) => <li key={li}><span className="ck">✓</span>{li}</li>)}</ul>
              </div>
              <div>{z.mock}</div>
            </div>
          ))}
        </div>
      </section>

      {/* video */}
      <section className="band" id="video" style={{ background: "var(--bg-alt)" }}>
        <div className="wrap center">
          <span className="eyebrow cream">Walkthrough</span>
          <h2 className="sec" style={{ marginTop: 14 }}>{data.videoTitle}</h2>
          <div className="videowrap"><div className="video">
            <button className="poster" type="button" aria-label="Play walkthrough" onClick={() => alert("Add your Loom embed here on the live site.")}>
              <div className="pbar"><i style={{ background: "#FF5F57" }} /><i style={{ background: "#FEBC2E" }} /><i style={{ background: "#28C840" }} /></div>
              <div className="cc"><span className="play"><svg width="24" height="26" viewBox="0 0 24 26"><path d="M2 2 L22 13 L2 24 Z" fill="#0E0E12" /></svg></span><span className="plabel">Play the 2-minute walkthrough</span></div>
              <span className="dur">2:04</span>
            </button>
          </div><p className="demo-cap">Loom-ready · drop in your embed to go live</p></div>
        </div>
      </section>

      {/* spec */}
      <section className="band">
        <div className="wrap"><span className="eyebrow">Under the hood</span><h2 className="sec" style={{ marginTop: 14 }}>The full feature set</h2>
          <div className="spec">{data.spec.map((s) => <div key={s.h} className="sp"><div className="h"><span className="d" />{s.h}</div><p>{s.p}</p></div>)}</div>
        </div>
      </section>

      {/* testimonials */}
      <section className="band" style={{ background: "var(--bg-alt)" }}>
        <div className="wrap center"><span className="placeholder-flag">⚠ Placeholder · replace with real customer quotes before launch</span><h2 className="sec" style={{ marginTop: 16 }}>What founders say</h2></div>
        <div className="wrap"><div className="tgrid">
          {data.testimonials.map((t, i) => (
            <div key={i} className="tcard"><span className="samp">Sample</span><div className="stars">★★★★★</div><blockquote>{t.quote}</blockquote>
              <div className="who"><span className="ini" style={{ background: t.iniBg }}>{t.ini}</span><div><div className="nm">Sample Name</div><div className="rl">{t.role}</div></div></div>
            </div>
          ))}
        </div></div>
      </section>

      {/* case studies */}
      <section className="band">
        <div className="wrap center"><span className="placeholder-flag">⚠ Illustrative · replace with real outcomes before launch</span><h2 className="sec" style={{ marginTop: 16 }}>Case studies</h2></div>
        <div className="wrap"><div className="cs">
          {data.cases.map((c) => (
            <div key={c.title} className="csc">
              <div className="top"><span className="co">{c.co}</span><span className="samp">Illustrative</span></div>
              <h3>{c.title}</h3>
              <div className="metric">{c.metrics.map((m) => <div key={m.span} className="m"><b>{m.b}</b><span>{m.span}</span></div>)}</div>
              <div className="body">
                <div className="row2"><div className="l">Problem</div><p>{c.problem}</p></div>
                <div className="row2"><div className="l">With {data.persona}</div><p>{c.withText}</p></div>
                <div className="row2"><div className="l">Result</div><p>{c.result}</p></div>
                <div className="cta"><a href="#">Read the full story ›</a></div>
              </div>
            </div>
          ))}
        </div></div>
      </section>

      {/* faq */}
      <section className="band" style={{ background: "var(--bg-alt)" }}>
        <div className="wrap center"><span className="eyebrow">Questions</span><h2 className="sec" style={{ marginTop: 14 }}>Answered</h2></div>
        <div className="faq">
          {data.faq.map((f, i) => (
            <details key={f.q} open={i === 0}><summary>{f.q} <span className="pm">+</span></summary><div className="ans">{f.a}</div></details>
          ))}
        </div>
      </section>

      {/* cross sell */}
      <section className="band">
        <div className="wrap">
          <h2 className="sec">The rest of the team</h2>
          <p className="lead">{data.crossIntro}</p>
          <div className="cross">
            {others.map((p) => (
              <Link key={p.id} className="xc" href={p.path}><span className="av"><Avatar id={p.avatar} /></span><div><div className="nm">{p.persona}</div><div className="rl">{p.name}</div></div><span className="go">›</span></Link>
            ))}
          </div>
        </div>
      </section>

      <section className="band closing"><div className="wrap"><h2>{data.closing.h}</h2><p>{data.closing.p}</p><div className="cta"><Link className="btn btn-lime" href="/dashboard">{data.hero.cta}</Link><a className="btn btn-ghost" href="#video">Watch the walkthrough ›</a></div></div></section>

      <SiteFooter />
    </>
  );
}

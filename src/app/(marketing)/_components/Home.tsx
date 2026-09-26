"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Avatar, type SpecialistId } from "./Avatars";
import { PRODUCTS, type Product } from "./products";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { Starfield } from "./Starfield";
import { Count } from "./Count";

const P = Object.fromEntries(PRODUCTS.map((p) => [p.avatar, p])) as Record<SpecialistId, Product>;
const ROLE: Record<SpecialistId, { pro: string; color: string }> = {
  scout: { pro: "Research Analyst", color: "#0B66A8" },
  ada: { pro: "SEO & AEO Strategist", color: "#3F6212" },
  iris: { pro: "Brand Guardian", color: "#8A5A1B" },
  quill: { pro: "Senior Copywriter", color: "#1E7A44" },
};

function Rail({ on }: { on: SpecialistId }) {
  const ids: SpecialistId[] = ["scout", "ada", "iris", "quill"];
  return (
    <aside className="rail">
      <div className="lg">M</div>
      {ids.map((id) => (
        <div key={id} className={`ri${id === on ? " on" : ""}`}>
          <Avatar id={id} />
        </div>
      ))}
    </aside>
  );
}

export function Home() {
  const [tab, setTab] = useState(0);
  const nm = (id: SpecialistId) => P[id].persona;

  const tabs: { key: SpecialistId; label: string }[] = [
    { key: "scout", label: "Research" },
    { key: "ada", label: "Score" },
    { key: "quill", label: "Write" },
    { key: "quill", label: "Repurpose" },
  ];

  return (
    <>
      <SiteNav />

      {/* HERO */}
      <section className="hero">
        <Starfield />
        <div className="wrap hero-in">
          <div>
            <span className="tag"><span className="new">FOR FOUNDERS</span><span className="t">…doing their own marketing</span></span>
            <h1 className="htitle">Get found on Google. <span className="hl">Get quoted by AI.</span></h1>
            <p className="sub">Mavrix runs a research sweep on your market every month, then writes and reshapes a month of on-brand content in your voice and strategy. The output of an agency, for less than one freelancer. Your first ranked briefs in minutes.</p>
            <div className="chips">
              <span className="chip"><span className="tick">✓</span> Rank on Google</span>
              <span className="chip"><span className="tick">✓</span> Quoted by AI search</span>
              <span className="chip"><span className="tick">✓</span> Converts to customers</span>
            </div>
            <div className="cta">
              <Link className="btn btn-lime" href="/dashboard">Start free</Link>
              <a className="btn btn-ghost" href="#how">See how it works ›</a>
            </div>
            <p className="micro">Free to start · No card required · First sweep in minutes</p>
          </div>

          <div className="hero-right">
            <div className="roster">
            <div className="top"><h3>Your content team</h3><span className="badge live">4 online</span></div>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>Working your market right now</p>
            <div className="grid">
              {(["scout", "ada", "iris", "quill"] as SpecialistId[]).map((id) => (
                <div key={id} className="mini">
                  <Avatar id={id} className="av" />
                  <div><div className="nm">{nm(id)}</div><div className="rl">{ROLE[id].pro}</div></div>
                </div>
              ))}
            </div>
            <div className="float"><span className="pulse" /><p>{nm("scout")} is sweeping. {nm("quill")} has 12 briefs queued.</p></div>
            </div>
            <div className="guar"><span className="s">✓</span><p><b>Founder guarantee:</b> if your first sweep doesn&rsquo;t hand you 10+ briefs worth writing, you don&rsquo;t pay. Ever.</p></div>
          </div>
        </div>
      </section>

      {/* channel strip */}
      <section className="strip2"><div className="in"><div className="head">One hour a month &rarr; a month of content that ranks.</div><div className="fmts"><span className="fmt">Blog &amp; CMS</span><span className="fmt">LinkedIn article</span><span className="fmt">LinkedIn post</span><span className="fmt">Newsletter</span><span className="fmt">Markdown export</span></div></div></section>

      {/* interactive demo */}
      <section className="band center" id="demo">
        <div className="wrap">
          <span className="eyebrow">See it in action</span>
          <h2 className="sec" style={{ marginTop: 14 }}>Watch the whole workflow, one click at a time</h2>
          <p className="lead" style={{ margin: "14px auto 0" }}>Research, score, write, repurpose. Same run, four screens.</p>
          <div className="tabs" role="tablist" aria-label="Product demo">
            {tabs.map((t, i) => (
              <button key={t.label} role="tab" aria-selected={tab === i} onClick={() => setTab(i)}>
                <span className="av"><Avatar id={t.key} /></span>{t.label}
              </button>
            ))}
          </div>
          <div className="demo-stage">
            {tab === 0 && (
              <div className="frame"><Bar u="app.mavrix.life/sweep" />
                <div className="app"><Rail on="scout" />
                  <div className="scr"><div className="scrh"><div><b>Intelligence run</b><span className="s">Six stages across the live web</span></div><span className="badge live">live</span></div><div className="prog"><i style={{ width: "82%" }} /></div>
                    <div className="lines" style={{ textAlign: "left" }}>
                      <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>Keyword stage: 34 phrases, 11 high-intent</span></div>
                      <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>Competitor stage: 5 profiled, 9 gaps</span></div>
                      <div className="ln"><span className="dt" style={{ background: "#DBFE7A" }} /><span>Trends: 4 rising topics this month</span></div>
                    </div>
                    <div className="scrf"><span>Ready to write</span><span className="k">12 briefs queued</span></div></div></div></div>
            )}
            {tab === 1 && (
              <div className="frame"><Bar u="app.mavrix.life/keywords" />
                <div className="app"><Rail on="ada" />
                  <div className="scr"><div className="scrh"><div><b>Ranked opportunities</b><span className="s">34 scored · 11 high-intent</span></div><span className="badge rank">ranked</span></div>
                    <table className="tbl" style={{ marginTop: 10 }}><thead><tr><th>Keyword</th><th>Intent</th><th>KD</th><th>Priority</th></tr></thead><tbody>
                      <tr><td className="kw">ai content workflow</td><td><span className="pill buy">Buyer</span></td><td><span className="kd"><span className="track"><i style={{ width: "32%", background: "#1E7A44" }} /></span>32</span></td><td><span className="pill hi">High</span></td></tr>
                      <tr><td className="kw">get cited by ai search</td><td><span className="pill hi">Info</span></td><td><span className="kd"><span className="track"><i style={{ width: "21%", background: "#1E7A44" }} /></span>21</span></td><td><span className="pill hi">High</span></td></tr>
                      <tr><td className="kw">seo for startups</td><td><span className="pill buy">Buyer</span></td><td><span className="kd"><span className="track"><i style={{ width: "54%", background: "#C9922B" }} /></span>54</span></td><td><span className="pill md">Medium</span></td></tr>
                    </tbody></table></div></div></div>
            )}
            {tab === 2 && (
              <div className="frame"><Bar u="app.mavrix.life/write" />
                <div className="app"><Rail on="quill" />
                  <div className="scr"><div className="wr">
                    <div className="doc"><div className="t">The founder&apos;s guide to AI search visibility</div>
                      <p>Buyers no longer start every search on Google. A growing share ask an AI assistant, and the brands that get quoted are the ones structured to be cited.</p>
                      <div className="bars"><i style={{ width: "100%" }} /><i style={{ width: "96%" }} /><i style={{ width: "98%" }} /><i style={{ width: "72%" }} /></div>
                    </div>
                    <div className="check"><h5>Draft check</h5>
                      <div className="row">Em dashes <span className="ok">0</span></div>
                      <div className="row">Banned terms <span className="ok">clear</span></div>
                      <div className="row">Voice match <span className="ok">on brand</span></div>
                      <div className="wc"><b>812</b><span>words, measured</span></div>
                    </div></div></div></div></div>
            )}
            {tab === 3 && (
              <div className="frame"><Bar u="app.mavrix.life/repurpose" />
                <div className="app"><Rail on="quill" />
                  <div className="scr"><div className="scrh"><div><b>Repurpose pack</b><span className="s">One article, four channels, one pass</span></div><span className="badge live">ready</span></div>
                    <div className="pack" style={{ marginTop: 14 }}>
                      <div className="pk"><div className="h"><span className="ic" style={{ background: "#0B66A8" }}>in</span>LinkedIn article</div><div className="bars"><i style={{ width: "100%" }} /><i style={{ width: "92%" }} /><i style={{ width: "80%" }} /></div><span className="tag2">600 to 900 words</span></div>
                      <div className="pk"><div className="h"><span className="ic" style={{ background: "#0B66A8" }}>in</span>LinkedIn post</div><div className="bars"><i style={{ width: "100%" }} /><i style={{ width: "70%" }} /></div><span className="tag2">120 to 220 words</span></div>
                      <div className="pk"><div className="h"><span className="ic" style={{ background: "#8A5A1B" }}>@</span>Newsletter block</div><div className="bars"><i style={{ width: "90%" }} /><i style={{ width: "100%" }} /><i style={{ width: "64%" }} /></div><span className="tag2">Subject plus teaser</span></div>
                      <div className="pk"><div className="h"><span className="ic" style={{ background: "#1E7A44" }}>md</span>Markdown export</div><div className="bars"><i style={{ width: "100%" }} /><i style={{ width: "96%" }} /></div><span className="tag2">Into your CMS</span></div>
                    </div></div></div></div>
            )}
          </div>
          <p className="demo-cap">Representative UI · swap for real screenshots or a short demo before launch</p>
        </div>
      </section>

      {/* MEET THE TEAM */}
      <section className="band" id="team" style={{ background: "var(--bg-alt)" }}>
        <div className="wrap center">
          <span className="eyebrow mint">Meet the team</span>
          <h2 className="sec" style={{ marginTop: 14 }}>Four specialists. None on the headcount.</h2>
          <p className="lead" style={{ margin: "14px auto 0" }}>Each owns a lane and hands off to the next, so the whole month gets made without you managing it.</p>
        </div>
        <div className="wrap">
          <div className="team-grid">
            {(["scout", "ada", "iris", "quill"] as SpecialistId[]).map((id) => (
              <div key={id} className="member">
                <div className="h"><Avatar id={id} className="avatar" /><div><h3>{nm(id)}</h3><div className="role" style={{ color: ROLE[id].color }}>{ROLE[id].pro}</div></div></div>
                <p className="q">{TEAM_QUOTE[id]}</p>
                <div className="out">{TEAM_OUT[id]}</div>
                <Link className="mlink" href={P[id].path}>See {nm(id)}&apos;s page ›</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (flow) */}
      <section className="band" id="how">
        <div className="wrap">
          <span className="eyebrow">How it works</span>
          <h2 className="sec" style={{ marginTop: 14 }}>One brief, four hands, no standup</h2>
          <p className="lead">A single run moves through the whole team. You approve at the points that matter.</p>
          <div className="flow">
            {([["scout", "Kicks off", "Fires the monthly sweep and streams every search and source as it reads them, live."],
              ["ada", "Scores it", "Ranks findings by difficulty and intent, and flags the AEO openings competitors missed."],
              ["iris", "Frames it", "Checks each ranked idea against your positioning and voice before a word gets written."],
              ["quill", "Writes it", "Drafts the piece to the brand, then repurposes it into a pack for every channel."]] as [SpecialistId, string, string][]).map(([id, label, text], i) => (
              <div key={id} className="leg">
                {i < 3 && <span className="arrow">›</span>}
                <div className="who"><Avatar id={id} className="avatar" /><div><div className="nm">{nm(id)}</div><div className="lbl">{label}</div></div></div>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="band"><div className="wrap">
        <div className="results">
          <div>
            <span className="eyebrow lime">Compounding</span>
            <h2 style={{ fontSize: 32, marginTop: 14 }}>Content that compounds into pipeline</h2>
            <p className="lead" style={{ marginTop: 12 }}>One team publishing every week beats a burst once a quarter. The library you build keeps ranking and getting cited long after you hit publish.</p>
            <div className="stat3">
              <div className="s"><b><Count to={6} /></b><span>research stages per sweep</span></div>
              <div className="s"><b><Count to={4} suffix="x" /></b><span>weekly beats monthly</span></div>
              <div className="s"><b><Count to={12} /></b><span>briefs from one run</span></div>
            </div>
          </div>
          <div className="chartcard">
            <div className="ct"><b>Publishing cadence</b><span className="ill">Illustrative</span></div>
            <svg viewBox="0 0 300 150" width="100%" height="150" role="img" aria-label="Illustrative upward trend of consistent weekly publishing">
              <line x1="8" y1="118" x2="292" y2="118" stroke="rgba(255,255,255,.18)" />
              <line x1="8" y1="80" x2="292" y2="80" stroke="rgba(255,255,255,.08)" />
              <line x1="8" y1="42" x2="292" y2="42" stroke="rgba(255,255,255,.08)" />
              <path d="M8,110 L52,104 L96,92 L140,80 L184,60 L228,40 L272,22 L292,18 L292,118 L8,118 Z" fill="url(#mk-chart)" opacity="0.5" />
              <path d="M8,110 L52,104 L96,92 L140,80 L184,60 L228,40 L272,22 L292,18" fill="none" stroke="#DBFE7A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="292" cy="18" r="4.5" fill="#DBFE7A" />
              <defs><linearGradient id="mk-chart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DBFE7A" stopOpacity=".55" /><stop offset="1" stopColor="#DBFE7A" stopOpacity="0" /></linearGradient></defs>
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "rgba(255,255,255,.5)", marginTop: 4 }}><span>Wk 1</span><span>Wk 4</span><span>Wk 8</span></div>
          </div>
        </div>
      </div></section>

      {/* WHO IT'S FOR */}
      <section className="band" style={{ background: "var(--bg-alt)" }}><div className="wrap">
        <div className="center"><span className="eyebrow sky">Read this before you start</span><h2 className="sec" style={{ marginTop: 14 }}>Who Mavrix is for</h2></div>
        <div className="whofor" style={{ marginTop: 36 }}>
          <div className="w yes"><h4>✓ A fit if you…</h4><ul>
            <li><span className="m">✓</span>Are a founder or lean team doing your own marketing</li>
            <li><span className="m">✓</span>Want to publish 4+ pieces a month, consistently</li>
            <li><span className="m">✓</span>Sell something where SEO and AI search matter</li>
            <li><span className="m">✓</span>Would rather edit than write from scratch</li>
          </ul></div>
          <div className="w no"><h4>✕ Not for you if you…</h4><ul>
            <li><span className="m">✕</span>Just need a one-off blog post</li>
            <li><span className="m">✕</span>Want a hands-off ghostwriter with zero input</li>
            <li><span className="m">✕</span>Have a full content team already humming</li>
            <li><span className="m">✕</span>Won&rsquo;t spend 20 minutes a week reviewing</li>
          </ul></div>
        </div>
      </div></section>

      {/* GUARANTEE */}
      <section className="band guarantee"><div className="wrap"><div className="in">
        <span className="seal">✓</span>
        <div><h2>Your first sweep pays for itself, or it&rsquo;s free.</h2><p>Run one sweep on the house. If it doesn&rsquo;t hand you 10+ briefs you&rsquo;d actually write, you owe nothing and keep everything it made. The risk is ours.</p></div>
      </div></div></section>

      {/* 30 DAYS */}
      <section className="band" id="thirty" style={{ background: "var(--bg-alt)" }}><div className="wrap">
        <span className="eyebrow">Your first 30 days</span>
        <h2 className="sec" style={{ marginTop: 14 }}>Ranked content = evergreen lead generation at $0 additional monthly costs.</h2>
        <p className="lead">Content Strategy done. Content created. Ready to publish.</p>
        <div className="tl">
          <div className="tlc"><span className="bar2" style={{ width: "33%" }} /><span className="ph">Day one</span><h3>Set up and swept</h3><ul><li><span className="ck">✓</span>Brand Brain built and approved</li><li><span className="ck">✓</span>First full market sweep run</li><li><span className="ck">✓</span>A ranked queue of briefs waiting</li></ul></div>
          <div className="tlc"><span className="bar2" style={{ width: "66%" }} /><span className="ph">Week one</span><h3>Published and reshaped</h3><ul><li><span className="ck">✓</span>First pieces written to brand</li><li><span className="ck">✓</span>Repurposed across your channels</li><li><span className="ck">✓</span>Exported straight to your CMS</li></ul></div>
          <div className="tlc"><span className="bar2" style={{ width: "100%" }} /><span className="ph">Month one</span><h3>Compounding, and owned</h3><ul><li><span className="ck">✓</span>A month of consistent publishing</li><li><span className="ck">✓</span>A second sweep on fresh trends</li><li><span className="ck">✓</span>A content library that is yours</li></ul></div>
        </div>
      </div></section>

      {/* PRICING */}
      <section className="band pricing" id="pricing"><div className="wrap">
        <p className="muted" style={{ color: "rgba(16,45,35,.7)", fontSize: 15 }}>One team, every plan</p>
        <h2 className="sec">Hire the whole team on every plan</h2>
        <p style={{ color: "rgba(16,45,35,.7)", marginTop: 10, maxWidth: 640 }}>Plans differ by volume, Brand Brains and seats, never by which teammates you work with.</p>
        <div className="plans">
          <Plan name="Launch" blurb="One brand, one founder, content done." amount="$99" featured feats={["1 Brand Brain", "The full team", "Monthly sweep plus on-demand", "Email support"]} />
          <Plan name="Growth" blurb="For agencies. Multiple clients, one solution." amount="$199" feats={["More seats", "Higher run limits", "Priority support", "Full repurposing pack"]} />
          <Plan name="Scale" blurb="Done for you. Team + Fractional CMO" amount="$5,000" feats={["Multiple Brand Brains", "Highest run limits", "Dedicated onboarding", "Priority support"]} />
        </div>
      </div></section>

      {/* FAQ */}
      <section className="band" id="faq"><div className="wrap center"><span className="eyebrow">Questions</span><h2 className="sec" style={{ marginTop: 14 }}>Answers before you ask</h2></div>
        <div className="faq">
          <Faq open q="How is this different from ChatGPT or a generic AI writer?" a="A chat box answers a prompt. Mavrix runs real market research first, scores it for search, holds it to a brand you approved, and hands you finished, channel-ready pieces. A workflow and a team, not a text box." />
          <Faq q="Will it actually sound like my brand?" a="Iris builds a Brand Brain from your voice, ICP and positioning, and enforces banned words on whole words. Nothing is written until you sign off the brand." />
          <Faq q="How does it get found on Google and in AI answers?" a="Ada scores every idea for difficulty and intent, targets featured snippets and the questions AI engines answer, and audits each draft for on-page and AEO before it ships." />
          <Faq q="Does it invent facts or fake statistics?" a="No. Mavrix writes from sources it actually read during the sweep, and streams every one so you can check them. No invented numbers, no fake citations." />
        </div>
      </section>

      {/* CLOSING */}
      <section className="band closing"><div className="wrap"><h2>Your content strategy and 30 days of content, done. In the next 3 minutes!</h2><p>Brief the team, run the first sweep, and watch the queue fill up. Free to start.</p><div className="cta"><Link className="btn btn-lime" href="/dashboard">Start free</Link><a className="btn btn-ghost" href="#demo">See it in action ›</a></div></div></section>

      <SiteFooter />
    </>
  );
}

function Bar({ u }: { u: string }) {
  return <div className="bar"><i style={{ background: "#FF5F57" }} /><i style={{ background: "#FEBC2E" }} /><i style={{ background: "#28C840" }} /><span className="u">{u}</span></div>;
}

function Plan({ name, blurb, amount, feats, featured }: { name: string; blurb: string; amount: string; feats: string[]; featured?: boolean }) {
  return (
    <div className={`plan${featured ? " feat" : ""}`}>
      {featured && <span className="flag">Most popular</span>}
      <h3>{name}</h3><p className="blurb">{blurb}</p>
      <div className="price"><b>{amount}</b><span>per month</span></div>
      <ul>{feats.map((f) => <li key={f}><span className="ck">✓</span>{f}</li>)}</ul>
      <Link className="go" href="/dashboard">Start free <span>›</span></Link>
    </div>
  );
}

function Faq({ q, a, open }: { q: string; a: string; open?: boolean }) {
  return (
    <details open={open}>
      <summary>{q} <span className="pm">+</span></summary>
      <div className="ans">{a}</div>
    </details>
  );
}

const TEAM_QUOTE: Record<SpecialistId, string> = {
  scout: "“I sweep your market and rank what is worth writing.”",
  ada: "“I score every idea and win the rankings on merit.”",
  iris: "“Nothing off brand ever leaves the building.”",
  quill: "“I draft to your rules, then reshape for every channel.”",
};

const TEAM_OUT: Record<SpecialistId, ReactNode> = {
  scout: (<div className="lines"><div className="ln"><span className="dt" style={{ background: "#60D184" }} /><span style={{ fontSize: 11.5 }}>34 keywords, 11 high-intent</span></div><div className="ln"><span className="dt" style={{ background: "#DBFE7A" }} /><span style={{ fontSize: 11.5 }}>12 briefs queued</span></div></div>),
  ada: (<div className="check" style={{ background: "transparent", border: 0, padding: 0 }}><div className="row" style={{ padding: "3px 0" }}>Difficulty <b style={{ color: "#1E7A44" }}>32 / low</b></div><div className="row" style={{ padding: "3px 0" }}>Intent <span className="pill buy">Buyer</span></div></div>),
  iris: (<div className="bb" style={{ gap: 0 }}><div className="chips2"><span>Direct</span><span>Warm</span><span className="ban">hype</span></div></div>),
  quill: (<div className="check" style={{ background: "transparent", border: 0, padding: 0 }}><div className="row" style={{ padding: "3px 0" }}>Em dashes <span className="ok">0</span></div><div className="row" style={{ padding: "3px 0" }}>Words <b style={{ color: "#0E0E12" }}>812</b></div></div>),
};

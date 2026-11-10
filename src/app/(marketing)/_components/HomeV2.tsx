"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Avatar, type SpecialistId } from "./Avatars";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { Starfield } from "./Starfield";
import { LiveScanModal } from "./LiveScanModal";

const APP = "/dashboard";

const TEAM: { id: SpecialistId; role: string; color: string; desc: string }[] = [
  { id: "scout", role: "Research Analyst", color: "#0B66A8", desc: "Measures what your buyers actually search and ranks what’s worth writing. 903 searches measured, 30 kept." },
  { id: "ada", role: "SEO & AEO Strategist", color: "#3F6212", desc: "Backs every keyword with real volume and difficulty, then shapes each piece to win Google and AI answers." },
  { id: "iris", role: "Brand Guardian", color: "#8A5A1B", desc: "Holds every draft to your voice and positioning, and vetoes keywords for products you don’t sell." },
  { id: "quill", role: "Senior Copywriter", color: "#1E7A44", desc: "Writes long-form to your brand, no em dashes, real word counts, then reshapes it for every channel." },
];
const NAME: Record<SpecialistId, string> = { scout: "Scout", ada: "Ada", iris: "Iris", quill: "Quill" };

export function HomeV2() {
  const [site, setSite] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [scanUrl, setScanUrl] = useState<string | null>(null);

  // Open the live scan on the entered URL. The modal runs the real scan and, on
  // "Continue", carries the scan token into sign-up so onboarding adopts it.
  const startSweep = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    let url = site.trim();
    if (!url) { setErr("Add your website to continue."); return; }
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try { new URL(url); } catch { setErr("That doesn’t look like a valid website."); return; }
    setScanUrl(url);
  };

  return (
    <>
      <SiteNav />

      {/* HERO */}
      <section className="hero">
        <Starfield />
        <div className="wrap hero-in">
          <div>
            <span className="tag"><span className="new">FOR FOUNDERS</span><span className="t">doing their own marketing</span></span>
            <h1 className="htitle">New customers can&rsquo;t find you. <span className="hl">We fix that.</span></h1>
            <p className="sub">Get Your Website Found and Recommended by <b>ChatGPT</b>, <b>Google</b>, and <b>AI Answers</b>. Convert More Customers.</p>

            <form className="magnet" id="magnet" onSubmit={startSweep}>
              <label htmlFor="site">Audit my site for free 👇</label>
              <div className="row">
                <div className="urlwrap"><span className="pre">https://</span><input id="site" type="text" placeholder="yourwebsite.com" autoComplete="off" value={site} onChange={(e) => setSite(e.target.value)} /></div>
                <button className="btn btn-lime mbtn" type="submit">Give me my content plan →</button>
              </div>
              {err && <div className="result" style={{ background: "var(--negbg)", color: "var(--neg)" }}>{err}</div>}
              <p className="micro">Free · No card required · First plan in minutes · Zero technical skills needed</p>
            </form>

            <div className="chips">
              <span className="chip"><span className="tick">✓</span> Create a content strategy</span>
              <span className="chip"><span className="tick">✓</span> Attract and target your ICP</span>
              <span className="chip"><span className="tick">✓</span> Convert search traffic to customers</span>
            </div>
          </div>

          <div className="hero-right">
            <div className="roster">
              <div className="top"><h3>Your Content Marketing Team</h3><span className="badge live">4 online</span></div>
              <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>Winning you traffic that converts customers</p>
              <div className="grid">
                {(["scout", "ada", "iris", "quill"] as SpecialistId[]).map((id) => (
                  <div key={id} className="mini">
                    <Avatar id={id} className="av" />
                    <div><div className="nm">{NAME[id]}</div><div className="rl">{TEAM.find((t) => t.id === id)!.role}</div></div>
                  </div>
                ))}
              </div>
              <div className="float"><span className="pulse" /><p>Scout measured 903 searches. Quill has 12 briefs queued.</p></div>
            </div>
            <div className="guar"><span className="s">✓</span><p><b>Founder guarantee:</b> if your first sweep doesn&rsquo;t hand you 10+ briefs worth writing, each backed by real search volume, you don&rsquo;t pay.</p></div>
          </div>
        </div>
      </section>

      {/* ENGINE STRIP */}
      <section className="engines"><div className="in">
        <span className="lbl">Built to win where buyers search now</span>
        <span className="e">ChatGPT</span><span className="e">Google</span><span className="e">AI Overviews</span><span className="e">Perplexity</span><span className="e">Gemini</span><span className="e">Claude</span>
      </div></section>

      {/* HOW IT WORKS */}
      <section className="band" id="how-steps"><div className="wrap">
        <div className="center">
          <span className="eyebrow sky">How it works</span>
          <h2 className="sec" style={{ marginTop: 14 }}>New customers can&rsquo;t find your website anywhere.</h2>
          <p className="lead c" style={{ fontWeight: 700, color: "var(--dark)" }}>Get listed in search engines quickly!</p>
          <p className="lead c">Start publishing keyword-rich, high-quality, human-approved, and AI-analyzed content, and quickly rank your business and win website traffic that actually wants to buy your products or services.</p>
        </div>
        <div className="steps">
          <div className="step"><div className="sic">1</div><h3>Add your website</h3><p>Mavrix audits your site and Google search trends and writes your content strategy.</p></div>
          <div className="step"><div className="sic">2</div><h3>Get your plan reviewed or auto-approved</h3><p>Mavrix generates daily long-form content targeting your ICP and wins organic search traffic.</p></div>
          <div className="step"><div className="sic">3</div><h3>Publishing</h3><p>Export AI-analyzed content in your brand voice and rich keyword opportunity, optimized for blogs and LinkedIn.</p></div>
          <div className="step"><div className="sic">4</div><h3>Get cited</h3><p>Each piece is built to rank on Google and get quoted in AEO AI answer engines to bring new customers.</p></div>
        </div>
      </div></section>

      {/* TEAM */}
      <section className="band" id="team" style={{ background: "var(--bg-alt)" }}><div className="wrap">
        <div className="center"><span className="eyebrow mint">Meet the team</span><h2 className="sec" style={{ marginTop: 14 }}>Your 24/7 performance marketing team.</h2><p className="lead c">A research analyst, SEO and content marketing strategist, brand guardian, and copywriter, with no extra headcount and no time off.</p></div>
        <div className="team-grid">
          {TEAM.map((t) => (
            <div key={t.id} className="member">
              <div className="h"><Avatar id={t.id} className="avatar" /><div><h3>{NAME[t.id]}</h3><div className="role" style={{ color: t.color }}>{t.role}</div></div></div>
              <p className="mdesc">{t.desc}</p>
            </div>
          ))}
        </div>
      </div></section>

      {/* MAVRIX VS MANUAL */}
      <section className="band" id="vs"><div className="wrap">
        <div className="center"><span className="eyebrow sky">Mavrix vs manual</span><h2 className="sec" style={{ marginTop: 14 }}>Why a DIY solution wastes your time and money.</h2><p className="lead c">Mavrix has thousands of hours of research, development, prompts, tests, and coding already done, so you can kickstart fast and see business growth results within 90 days.</p></div>
        <div style={{ overflowX: "auto" }}>
          <table className="vstable">
            <thead><tr><th style={{ minWidth: 230 }}>&nbsp;</th><th className="me">Mavrix</th><th>DIY / manual</th><th>Agency retainer</th></tr></thead>
            <tbody>
              <tr><td>Measures real search volume before writing</td><td className="c y">✓</td><td className="c n">✕</td><td className="c p">Sometimes</td></tr>
              <tr><td>Checks Google&rsquo;s page one and AI answers</td><td className="c y">✓</td><td className="c n">✕</td><td className="c p">Sometimes</td></tr>
              <tr><td>Holds every draft to your approved brand</td><td className="c y">✓</td><td className="c n">You prompt it</td><td className="c y">✓</td></tr>
              <tr><td>A ranked 30-day plan, not one-off answers</td><td className="c y">✓</td><td className="c n">✕</td><td className="c y">✓</td></tr>
              <tr><td>Reshapes one piece for every channel</td><td className="c y">✓</td><td className="c n">By hand</td><td className="c p">Extra cost</td></tr>
              <tr><td>Google Trends synced</td><td className="c y">✓</td><td className="c n">By hand</td><td className="c n">By hand</td></tr>
              <tr><td>Convert YouTube and podcasts into content</td><td className="c y">✓</td><td className="c p">Extra cost</td><td className="c p">Extra cost</td></tr>
              <tr><td>Monthly cost</td><td className="c y">From $99</td><td className="c p">Your hours</td><td className="c n">$3,000+</td></tr>
            </tbody>
          </table>
        </div>
      </div></section>

      {/* COMPOUNDING */}
      <section className="band" id="compounding" style={{ background: "var(--bg-alt)" }}><div className="wrap">
        <div className="results">
          <div>
            <span className="eyebrow lime">Compounding</span>
            <h2 style={{ fontSize: 32, marginTop: 14 }}>Content that compounds into pipeline</h2>
            <p className="lead" style={{ marginTop: 12 }}>One team publishing every week beats a burst once a quarter. The library you build keeps ranking and getting cited long after you hit publish.</p>
            <div className="stat3">
              <div className="s"><b>30</b><span>pieces of content per month</span></div>
              <div className="s"><b>100s</b><span>keywords analyzed and audited</span></div>
              <div className="s"><b>45</b><span>minutes per month to manage your content strategy</span></div>
            </div>
          </div>
          <div className="chartcard">
            <div className="ct"><b>Publishing cadence</b><span className="ill">Illustrative</span></div>
            <svg viewBox="0 0 300 150" width="100%" height="150" role="img" aria-label="Illustrative upward trend of consistent weekly publishing">
              <line x1="8" y1="118" x2="292" y2="118" stroke="rgba(255,255,255,.18)" />
              <line x1="8" y1="80" x2="292" y2="80" stroke="rgba(255,255,255,.08)" />
              <line x1="8" y1="42" x2="292" y2="42" stroke="rgba(255,255,255,.08)" />
              <path d="M8,110 L52,104 L96,92 L140,80 L184,60 L228,40 L272,22 L292,18 L292,118 L8,118 Z" fill="url(#mk-chart2)" opacity="0.5" />
              <path d="M8,110 L52,104 L96,92 L140,80 L184,60 L228,40 L272,22 L292,18" fill="none" stroke="#DBFE7A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="292" cy="18" r="4.5" fill="#DBFE7A" />
              <defs><linearGradient id="mk-chart2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DBFE7A" stopOpacity=".55" /><stop offset="1" stopColor="#DBFE7A" stopOpacity="0" /></linearGradient></defs>
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "rgba(255,255,255,.5)", marginTop: 4 }}><span>Wk 1</span><span>Wk 4</span><span>Wk 8</span></div>
          </div>
        </div>
      </div></section>

      {/* WHO */}
      <section className="band"><div className="wrap">
        <div className="center"><span className="eyebrow">Read this before you start</span><h2 className="sec" style={{ marginTop: 14 }}>Who Mavrix is for</h2></div>
        <div className="whofor" style={{ marginTop: 34 }}>
          <div className="w yes"><h4>✓ A fit if you…</h4><ul>
            <li><span className="m">✓</span>Are a founder or lean team doing your own marketing</li>
            <li><span className="m">✓</span>Want to publish consistently without hiring</li>
            <li><span className="m">✓</span>Sell something where Google and AI search matter</li>
            <li><span className="m">✓</span>Would rather edit than write from a blank page</li>
          </ul></div>
          <div className="w no"><h4>✕ Not for you if you…</h4><ul>
            <li><span className="m">✕</span>Just need a one-off blog post</li>
            <li><span className="m">✕</span>Want a hands-off ghostwriter with zero input</li>
            <li><span className="m">✕</span>Have a full content team already humming</li>
            <li><span className="m">✕</span>Won&rsquo;t spend 20 minutes a week reviewing</li>
          </ul></div>
        </div>
      </div></section>

      {/* FOUNDER NOTE */}
      <section className="band"><div className="wrap">
        <div className="founder">
          <span className="ava"><Avatar id="scout" /></span>
          <div>
            <p>&ldquo;We built Mavrix because we were tired of AI tools that confidently write about keywords nobody searches. So we made measurement the first step, not an afterthought. Run one sweep on us. If it doesn&rsquo;t hand you ten briefs you&rsquo;d actually write, you owe nothing and keep everything it made.&rdquo;</p>
            <div className="sig">The Mavrix founding team<span>Try it free for your first sweep, the risk is ours.</span></div>
          </div>
        </div>
      </div></section>

      {/* CLOSING */}
      <section className="band closing"><div className="wrap"><h2>New customers can&rsquo;t find you. Let&rsquo;s fix that in the next 3 minutes.</h2><p>Drop your website, get an audit and a 30-day growth plan. Free to start.</p><div className="cta"><a className="btn btn-lime" href="#magnet">Audit my site →</a><a className="btn btn-ghost" href="#how-steps">See how it works ›</a></div></div></section>

      {scanUrl && <LiveScanModal url={scanUrl} onClose={() => setScanUrl(null)} />}

      <SiteFooter />
    </>
  );
}

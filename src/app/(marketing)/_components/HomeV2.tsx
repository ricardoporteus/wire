"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Avatar, type SpecialistId } from "./Avatars";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { Starfield } from "./Starfield";
import { Count } from "./Count";
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
            <h1 className="htitle">Get found and recommended by <span className="cg">ChatGPT</span>, <span className="gg">Google</span> and <span className="hl">AI answers.</span></h1>
            <ul className="gap">
              <li><span className="ic">⏰</span><span>Your competitors have published for years. Every month you stay quiet, their content gets cited instead of yours.</span></li>
              <li><span className="ic">📈</span><span><b>Mavrix catches you up.</b> It measures what your buyers search, then writes and reshapes a month of on-brand content built to rank and get quoted.</span></li>
            </ul>

            <form className="magnet" onSubmit={startSweep}>
              <label htmlFor="site">See what you could rank for 👇</label>
              <div className="row">
                <div className="urlwrap"><span className="pre">https://</span><input id="site" type="text" placeholder="yourwebsite.com" autoComplete="off" value={site} onChange={(e) => setSite(e.target.value)} /></div>
                <button className="btn btn-lime mbtn" type="submit">Get 10 measured keywords + a 30-day plan →</button>
              </div>
              {err && <div className="result" style={{ background: "var(--negbg)", color: "var(--neg)" }}>{err}</div>}
              <p className="micro">Free · No card required · First plan in minutes · Zero technical skills needed</p>
            </form>

            <div className="chips">
              <span className="chip"><span className="tick">✓</span> Keywords people actually search</span>
              <span className="chip"><span className="tick">✓</span> Quoted by AI search</span>
              <span className="chip"><span className="tick">✓</span> Converts to customers</span>
            </div>
          </div>

          <div className="hero-right">
            <div className="roster">
              <div className="top"><h3>Your content team</h3><span className="badge live">4 online</span></div>
              <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>Working your market right now</p>
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
            <div className="guar"><span className="s">✓</span><p><b>Founder guarantee:</b> if your first sweep doesn&rsquo;t hand you 10+ briefs worth writing, each backed by real search volume, you don&rsquo;t pay. Ever.</p></div>
          </div>
        </div>
      </section>

      {/* ENGINE STRIP */}
      <section className="engines"><div className="in">
        <span className="lbl">Built to win where buyers search now</span>
        <span className="e">ChatGPT</span><span className="e">Google</span><span className="e">AI Overviews</span><span className="e">Perplexity</span><span className="e">Gemini</span>
      </div></section>

      {/* MEASURE */}
      <section className="band"><div className="wrap">
        <div className="measure">
          <div>
            <span className="eyebrow">The difference</span>
            <h2 className="bigline" style={{ marginTop: 16 }}>Most AI tools guess your keywords. <span className="hl">Mavrix measures them.</span></h2>
            <p className="lead">Publishing is pointless if no one searches the topic. In our testing across three brands, only 3 to 13% of the keywords AI picked on its own had any real search volume. Mavrix measures every one before it writes a word.</p>
            <div className="proof3">
              <div className="pf"><span className="n">1</span><h4>People search it</h4><p>Real monthly Google search volume on every keyword.</p></div>
              <div className="pf"><span className="n">2</span><h4>You can win it</h4><p>A 0 to 100 difficulty score: under 30 low, 30&ndash;59 medium, 60+ high.</p></div>
              <div className="pf"><span className="n">3</span><h4>Your buyer types it</h4><p>Fit rated against your Brand Brain, so it matches who you sell to.</p></div>
            </div>
          </div>
          <div className="frame"><Bar u="app.mavrix.agency/keywords" />
            <div className="scr">
              <div className="scrh"><div><b>Ranked opportunities</b><span className="s">903 measured · 30 kept · 10 P1</span></div><span className="badge rank">ranked</span></div>
              <table className="tbl" style={{ marginTop: 10 }}><thead><tr><th>Keyword</th><th>Volume</th><th>KD</th><th>Priority</th></tr></thead><tbody>
                <tr><td className="kw">aeo vs seo</td><td>1,900/mo</td><td><span className="kd"><span className="track"><i style={{ width: "17%", background: "#1E7A44" }} /></span>17</span></td><td><span className="pill hi">P1</span></td></tr>
                <tr><td className="kw">answer engine optimization</td><td>2,400/mo</td><td><span className="kd"><span className="track"><i style={{ width: "43%", background: "#C9922B" }} /></span>43</span></td><td><span className="pill hi">P1</span></td></tr>
                <tr><td className="kw">automated seo tools</td><td>720/mo</td><td><span className="kd"><span className="track"><i style={{ width: "19%", background: "#1E7A44" }} /></span>19</span></td><td><span className="pill hi">P1</span></td></tr>
                <tr><td className="kw">how to get cited by chatgpt</td><td>110/mo</td><td><span className="kd"><span className="track"><i style={{ width: "9%", background: "#1E7A44" }} /></span>9</span></td><td><span className="pill md">P2</span></td></tr>
              </tbody></table>
            </div>
          </div>
        </div>
      </div></section>

      {/* PAGE ONE CHECK */}
      <section className="band" style={{ background: "var(--bg-alt)" }}><div className="wrap">
        <div className="po">
          <div className="frame"><Bar u="app.mavrix.agency/page-one" />
            <div className="scr">
              <div className="scrh"><div><b>Page-one check</b><span className="s">Keyword: &ldquo;answer engine optimization&rdquo;</span></div><span className="badge rank">live</span></div>
              <div className="lines" style={{ marginTop: 12 }}>
                <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>AI Overview present &mdash; structure to be the cited answer</span></div>
                <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>People Also Ask: 4 real questions pulled from Google</span></div>
                <div className="ln"><span className="dt" style={{ background: "#C9922B" }} /><span>No featured snippet yet &mdash; opening to claim one</span></div>
              </div>
              <div className="callout">Write it as: a listicle with a 40-word definition up top.</div>
            </div>
          </div>
          <div>
            <span className="eyebrow cream">The Page-One Check</span>
            <h2 className="sec" style={{ marginTop: 16 }}>Before you write, see what page one rewards</h2>
            <p className="lead">For your top keywords, Mavrix runs a live check on Google&rsquo;s first page: is there an AI Overview, a People Also Ask box, a featured snippet? Then it recommends the exact format that ranks and shapes each piece to be the answer those boxes quote.</p>
            <p className="lead">In our testing, 29 of 30 Google results pages we checked showed an AI Overview, and none showed a featured snippet. That is where your buyers now land, so that is what Mavrix writes for.</p>
          </div>
        </div>
      </div></section>

      {/* HOW IT WORKS */}
      <section className="band" id="how-steps"><div className="wrap">
        <div className="center"><span className="eyebrow sky">How it works</span><h2 className="sec" style={{ marginTop: 14 }}>From your website to ranked content in four steps</h2><p className="lead c">Drop your link and the team takes it from there. You stay in control at every step, zero technical skills needed.</p></div>
        <div className="steps">
          <div className="step"><div className="no">01</div><h3>Add your website</h3><p>Point Mavrix at your site. It builds a Brand Brain &mdash; your voice, offers, buyers and competitors &mdash; in minutes.</p></div>
          <div className="step"><div className="no">02</div><h3>Get your plan</h3><p>Mavrix measures hundreds of real searches, scores them with the 3-Proof Filter and hands you a ranked 30-day plan.</p></div>
          <div className="step"><div className="no">03</div><h3>Review or auto-approve</h3><p>Approve the queue yourself, or let the team write straight through. You decide how hands-on to be.</p></div>
          <div className="step"><div className="no">04</div><h3>Publish and get cited</h3><p>On-brand content ships to every channel, built to rank on Google and be quoted in AI answers.</p></div>
        </div>
      </div></section>

      {/* TEAM */}
      <section className="band" id="team" style={{ background: "var(--bg-alt)" }}><div className="wrap">
        <div className="center"><span className="eyebrow mint">Meet the team</span><h2 className="sec" style={{ marginTop: 14 }}>Four jobs. One team.</h2><p className="lead c">A research analyst, an SEO strategist, a brand guardian and a copywriter, none on your headcount.</p></div>
        <div className="team-grid">
          {TEAM.map((t) => (
            <div key={t.id} className="member">
              <div className="h"><Avatar id={t.id} className="avatar" /><div><h3>{NAME[t.id]}</h3><div className="role" style={{ color: t.color }}>{t.role}</div></div></div>
              <p className="mdesc">{t.desc}</p>
            </div>
          ))}
        </div>
      </div></section>

      {/* MAVRIX VS CHATGPT */}
      <section className="band" id="vs"><div className="wrap">
        <div className="center"><span className="eyebrow sky">Mavrix vs ChatGPT</span><h2 className="sec" style={{ marginTop: 14 }}>Why a chat box won&rsquo;t get you found</h2><p className="lead c">ChatGPT writes words on demand. Mavrix runs the whole visibility workflow, measured end to end.</p></div>
        <div style={{ overflowX: "auto" }}>
          <table className="vstable">
            <thead><tr><th style={{ minWidth: 230 }}>&nbsp;</th><th className="me">Mavrix</th><th>ChatGPT alone</th><th>Agency retainer</th></tr></thead>
            <tbody>
              <tr><td>Measures real search volume before writing</td><td className="c y">✓</td><td className="c n">✕</td><td className="c p">Sometimes</td></tr>
              <tr><td>Checks Google&rsquo;s page one and AI answers</td><td className="c y">✓</td><td className="c n">✕</td><td className="c p">Sometimes</td></tr>
              <tr><td>Holds every draft to your approved brand</td><td className="c y">✓</td><td className="c n">You prompt it</td><td className="c y">✓</td></tr>
              <tr><td>A ranked 30-day plan, not one-off answers</td><td className="c y">✓</td><td className="c n">✕</td><td className="c y">✓</td></tr>
              <tr><td>Reshapes one piece for every channel</td><td className="c y">✓</td><td className="c n">By hand</td><td className="c p">Extra cost</td></tr>
              <tr><td>Monthly cost</td><td className="c y">From $99</td><td className="c p">Your hours</td><td className="c n">$3,000+</td></tr>
            </tbody>
          </table>
        </div>
      </div></section>

      {/* NUMBER BAND */}
      <section className="band" style={{ background: "var(--bg-alt)" }}><div className="wrap">
        <div className="center"><span className="eyebrow">Built on real search data</span><h2 className="sec" style={{ marginTop: 14 }}>Measured, not guessed</h2></div>
        <div className="nums" style={{ marginTop: 34 }}>
          <div className="st"><b>400+</b><span>real searches measured per sweep</span></div>
          <div className="st"><b>0&ndash;100</b><span>difficulty score on every keyword</span></div>
          <div className="st"><b>30</b><span>days of ranked content per sweep</span></div>
          <div className="st"><b>29/30</b><span>results pages showed an AI Overview</span></div>
          <div className="cap">Figures are Mavrix product mechanics and findings from our own testing across three brands. No customer results are implied.</div>
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

      {/* COMPOUNDING */}
      <section className="band" id="compounding" style={{ background: "var(--bg-alt)" }}><div className="wrap">
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

      {/* PRICING */}
      <section className="band pricing" id="pricing" style={{ background: "var(--bg-alt)" }}><div className="wrap">
        <div className="center"><span className="eyebrow">One team, every plan</span><h2 className="sec" style={{ marginTop: 14 }}>Hire the whole team on every plan</h2><p className="lead c">Plans differ by volume, Brand Brains and seats, never by which teammates you work with.</p></div>
        <div className="plans">
          <Plan name="Launch" blurb="One brand, one founder, content done." amount="$99" featured feats={["1 Brand Brain", "Real search volume + difficulty on every keyword", "The full team", "Monthly sweep plus on-demand", "Email support"]} />
          <Plan name="Growth" blurb="For agencies. Multiple clients, one solution." amount="$199" feats={["More seats", "Real search volume + difficulty on every keyword", "Higher run limits", "Priority support", "Full repurposing pack"]} />
          <Plan name="Scale" blurb="Done for you. Team + Fractional CMO." amount="$5,000" feats={["Multiple Brand Brains", "Real search volume + difficulty on every keyword", "Highest run limits", "Dedicated onboarding", "Priority support"]} />
        </div>
      </div></section>

      {/* FAQ */}
      <section className="band" id="faq"><div className="wrap center"><span className="eyebrow">Questions, answered</span><h2 className="sec" style={{ marginTop: 14 }}>The things founders ask before starting</h2></div>
        <div className="faq">
          <Faq open q="What do I get after I drop my website?" a="Your first free sweep: 10 keywords with real monthly search volume and a 0 to 100 difficulty score, plus a 30-day content plan ranked by opportunity. In minutes, with no card required." />
          <Faq q="Will it get me into ChatGPT and AI answers?" a="That is the point. Mavrix checks Google's live page one for your top keywords, sees whether an AI Overview or People Also Ask box is there, and shapes each piece to be the answer those engines quote. In our testing, 29 of 30 results pages showed an AI Overview." />
          <Faq q="Are the search volumes real?" a="Yes. Every recommended keyword comes with its measured monthly Google search volume and a 0 to 100 difficulty score, refreshed every sweep. If a number ever cannot be measured, it is clearly labelled as an estimate." />
          <Faq q="How is this different from using ChatGPT myself?" a="A chat box answers a prompt. Mavrix measures real demand first, scores it, holds it to a brand you approved, checks what page one rewards, and hands you finished, channel-ready pieces. A workflow and a team, not a text box." />
          <Faq q="Do I need any technical or SEO skills?" a="None. Add your website, review a ranked plan in plain language, and approve. The team handles the research, scoring and writing." />
          <Faq q="Do I stay in control of what publishes?" a="Always. Review and approve the queue yourself, or let the team write straight through. You can edit any draft before it ships." />
        </div>
      </section>

      {/* CLOSING */}
      <section className="band closing"><div className="wrap"><h2>See what you could rank for in the next 3 minutes.</h2><p>Drop your website, get 10 measured keywords and a 30-day plan. Free to start.</p><div className="cta"><Link className="btn btn-lime" href={APP}>Get my free plan</Link><a className="btn btn-ghost" href="#how-steps">See how it works ›</a></div></div></section>

      {scanUrl && <LiveScanModal url={scanUrl} onClose={() => setScanUrl(null)} />}

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
      <Link className="go" href={APP}>Start free <span>›</span></Link>
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

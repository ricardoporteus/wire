import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "../_components/SiteNav";
import { SiteFooter } from "../_components/SiteFooter";

export const metadata: Metadata = {
  title: "Pricing — Mavrix",
  description:
    "Hire the whole Mavrix team on every plan. Plans differ by volume, Brand Brains and seats, never by which teammates you work with. From $99/month, free to start.",
  alternates: { canonical: "/pricing" },
};

/** App entry (sign in / start free). On the marketing host, middleware bounces
 * /dashboard to the app host; locally it resolves in-app. */
const APP = "/dashboard";

export default function PricingPage() {
  return (
    <>
      <SiteNav />

      {/* PAGE HEAD */}
      <section className="band" style={{ background: "var(--dark)", paddingBottom: 0 }}><div className="wrap center">
        <span className="eyebrow lime">Pricing</span>
        <h1 className="sec" style={{ color: "#fff", marginTop: 14 }}>Hire the whole team on every plan</h1>
        <p className="lead c" style={{ color: "rgba(255,255,255,.66)" }}>Plans differ by volume, Brand Brains and seats, never by which teammates you work with.</p>
      </div></section>

      {/* PRICING */}
      <section className="band pricing" id="pricing"><div className="wrap">
        <div className="plans">
          <Plan name="Launch" blurb="One brand, one founder, content done." amount="$99" featured feats={["1 Brand Brain", "Real search volume + difficulty on every keyword", "The full team", "Monthly sweep plus on-demand", "Email support"]} />
          <Plan name="Growth" blurb="For agencies. Multiple clients, one solution." amount="$199" feats={["More seats", "Real search volume + difficulty on every keyword", "Higher run limits", "Priority support", "Full repurposing pack"]} />
          <Plan name="Scale" blurb="Done for you. Team + Fractional CMO." amount="$5,000" feats={["Multiple Brand Brains", "Real search volume + difficulty on every keyword", "Highest run limits", "Dedicated onboarding", "Priority support"]} />
        </div>
      </div></section>

      {/* FAQ */}
      <section className="band" id="faq" style={{ background: "var(--bg-alt)" }}><div className="wrap center"><span className="eyebrow">Questions, answered</span><h2 className="sec" style={{ marginTop: 14 }}>The things founders ask before starting</h2></div>
        <div className="faq">
          <Faq open q="What do I get after I drop my website?" a="Your first free sweep: 10 keywords with real monthly search volume and a 0 to 100 difficulty score, plus a 30-day content plan ranked by opportunity. In minutes, with no card required." />
          <Faq q="Will it get me into ChatGPT and AI answers?" a="That is the point. Mavrix checks Google's live page one for your top keywords, sees whether an AI Overview or People Also Ask box is there, and shapes each piece to be the answer those engines quote. In our testing, 29 of 30 results pages showed an AI Overview." />
          <Faq q="Are the search volumes real?" a="Yes. Every recommended keyword comes with its measured monthly Google search volume and a 0 to 100 difficulty score, refreshed every sweep. If a number ever cannot be measured, it is clearly labelled as an estimate." />
          <Faq q="How is this different from using ChatGPT myself?" a="A chat box answers a prompt. Mavrix measures real demand first, scores it, holds it to a brand you approved, checks what page one rewards, and hands you finished, channel-ready pieces. A workflow and a team, not a text box." />
          <Faq q="Do I need any technical or SEO skills?" a="None. Add your website, review a ranked plan in plain language, and approve. The team handles the research, scoring and writing." />
          <Faq q="Do I stay in control of what publishes?" a="Always. Review and approve the queue yourself, or let the team write straight through. You can edit any draft before it ships." />
        </div>
      </section>

      <SiteFooter />
    </>
  );
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

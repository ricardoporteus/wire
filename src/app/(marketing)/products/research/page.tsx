import type { Metadata } from "next";
import { ProductPage, type ProductData } from "../../_components/ProductPage";
import { Bar, Rail } from "../../_components/Mock";

export const metadata: Metadata = {
  title: "Research — Mavrix",
  description: "Scout sweeps your whole market every month and hands you a queue of ideas, ranked by opportunity. Know exactly what to write, before you write it.",
  alternates: { canonical: "/products/research" },
};

const sweepMock = (
  <div className="frame"><Bar u="app.mavrix.life/sweep" />
    <div className="app"><Rail on="scout" />
      <div className="scr"><div className="scrh"><div><b>Intelligence run</b><span className="s">Stage 4 of 6 · 18 sources read</span></div><span className="badge live">live</span></div><div className="prog"><i style={{ width: "66%" }} /></div>
        <div className="lines">
          <div className="ln"><span className="dt" style={{ background: "#0B66A8" }} /><span>Searching: <span className="mono">competitor content velocity</span></span></div>
          <div className="ln"><span className="dt" style={{ background: "#8A8A93" }} /><span>Read: competitor blog, 42 posts indexed</span></div>
          <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>AEO stage: 18 questions, 6 snippet targets</span></div>
          <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>Keyword stage: 34 phrases, 11 high-intent</span></div>
        </div>
        <div className="scrf"><span>Ideas ranked</span><span className="k">12 briefs queued</span></div></div></div></div>
);

const tableMock = (
  <div className="frame"><Bar u="app.mavrix.life/keywords" />
    <div className="app"><Rail on="scout" />
      <div className="scr"><div className="scrh"><div><b>Ranked opportunities</b><span className="s">34 scored · 11 high-intent</span></div><span className="badge rank">ranked</span></div>
        <table className="tbl" style={{ marginTop: 10 }}><thead><tr><th>Keyword</th><th>Intent</th><th>KD</th><th>Priority</th></tr></thead><tbody>
          <tr><td className="kw">ai content workflow</td><td><span className="pill buy">Buyer</span></td><td><span className="kd"><span className="track"><i style={{ width: "32%", background: "#1E7A44" }} /></span>32</span></td><td><span className="pill hi">High</span></td></tr>
          <tr><td className="kw">get cited by ai search</td><td><span className="pill hi">Info</span></td><td><span className="kd"><span className="track"><i style={{ width: "21%", background: "#1E7A44" }} /></span>21</span></td><td><span className="pill hi">High</span></td></tr>
          <tr><td className="kw">seo for startups</td><td><span className="pill buy">Buyer</span></td><td><span className="kd"><span className="track"><i style={{ width: "54%", background: "#C9922B" }} /></span>54</span></td><td><span className="pill md">Medium</span></td></tr>
        </tbody></table></div></div></div>
);

const data: ProductData = {
  id: "research", avatar: "scout", persona: "Scout", role: "Research Analyst", roleColor: "#0B66A8",
  hero: {
    title: <>Know exactly what to write, <span className="hl">before you write it</span></>,
    sub: "Scout sweeps your whole market every month and hands you a queue of ideas, ranked by opportunity. No more guessing, no more blank calendar.",
    cta: "Run a free sweep", mock: sweepMock,
  },
  pains: {
    old: ["Blank calendar. You write whatever comes to mind.", "Keyword tools dump 500 rows with no priorities.", "Competitors rank for terms you have never seen.", "Proper research eats a full day you do not have."],
    fixes: [
      { b: "A ranked queue waiting every month.", chip: "Ranked idea queue" },
      { b: "Every phrase scored and ordered by priority.", chip: "Intent + difficulty scoring" },
      { b: "The exact gaps competitors left, surfaced.", chip: "Competitor gap analysis" },
      { b: "Six stages in minutes, streamed live.", chip: "Live six-stage sweep" },
    ],
  },
  benefits: [
    { ic: "🗓️", h: "Never a blank calendar", p: "You always open the month with a queue of ideas worth writing, not a cursor blinking on an empty page." },
    { ic: "🎯", h: "Words only where they win", p: "Pursue only the keywords you can realistically rank for, scored before you spend a draft." },
    { ic: "⚡", h: "Move while it is hot", p: "Catch rising trends and competitor gaps this month, not after they have peaked." },
  ],
  zigs: [
    { klabel: "Benefit · a month of ideas in minutes", h: "One sweep, six stages, a full queue", p: "Scout runs keyword, competitor, gap, AEO and trend passes across the live web, then ranks the results into briefs.", bullets: ["Six research stages in a single run", "Streamed live so nothing feels stuck", "Ends in a ranked, ready-to-write queue"], mock: sweepMock },
    { klabel: "Benefit · only chase winnable keywords", h: "Scored and ranked, not just listed", p: "Every idea comes with an intent label and a difficulty score, ordered so the highest-opportunity work sits at the top.", bullets: ["Buyer vs informational intent tagged", "Difficulty scored, priority ranked", "The reasoning shown, not hidden"], mock: tableMock, flip: true },
  ],
  videoTitle: "Watch Scout run a sweep, start to finish",
  spec: [
    { h: "Keyword intelligence", p: "High-intent, informational and long-tail phrases, scored and grouped." },
    { h: "Competitor sweep", p: "Profiles the players in your space and what they are ranking for." },
    { h: "Content gaps", p: "The topics competitors rank for that you have not covered." },
    { h: "AI search (AEO)", p: "The questions AI answer engines field, and snippet targets to win." },
    { h: "Trends", p: "Rising topics in your market, caught while they are still climbing." },
    { h: "Ranked ideas", p: "Everything above, ranked into a queue of briefs ready to write." },
  ],
  testimonials: [
    { quote: "“The sweep surfaced three topics we would never have thought of. Two are on page one now.”", ini: "JK", iniBg: "#A9DBFF", role: "Founder, B2B SaaS" },
    { quote: "“I stopped guessing what to write. The ranked queue is my content calendar now.”", ini: "SM", iniBg: "#DBFE7A", role: "Solo marketer" },
    { quote: "“It replaced the monthly research retainer we were paying a contractor for.”", ini: "AO", iniBg: "#FFECD3", role: "Agency owner" },
  ],
  cases: [
    { co: "Seed-stage B2B SaaS · solo founder", title: "A quarter of content, planned in an afternoon", metrics: [{ b: "12", span: "briefs from one sweep" }, { b: "6×", span: "publishing pace" }], problem: "One founder, no marketing hire, and a blank content calendar every month.", withText: "Ran the monthly sweep, took the ranked queue straight into drafting.", result: "Twelve briefs queued in one run; six live in the first two weeks." },
    { co: "Content agency · 4 client brands", title: "Retired a monthly research retainer", metrics: [{ b: "1 day → 20 min", span: "research per brand" }, { b: "4", span: "brands, one workflow" }], problem: "Paying a contractor to hand-build keyword research for every client, every month.", withText: "Swapped the retainer for a monthly sweep per client Brand Brain.", result: "Same depth of research in a fraction of the time, at a fraction of the cost." },
  ],
  faq: [
    { q: "How long does a sweep take?", a: "Minutes, not hours. Scout streams each stage as it runs, so you watch the queue fill in real time." },
    { q: "Where does the data come from?", a: "Live web research during the run. Every source is shown as it is read, so nothing is invented or hidden." },
    { q: "Can I run it more than monthly?", a: "Yes. The monthly sweep is automatic, and you can fire an on-demand run any time credits allow." },
    { q: "Does it work for my niche?", a: "The sweep adapts to your Brand Brain, so it researches your market and ICP rather than a generic list." },
  ],
  crossIntro: "Research is where it starts. The queue Scout builds flows straight to the others.",
  closing: { h: "Run your first sweep in the next five minutes", p: "Free to start. Watch Scout fill your queue before you finish your coffee." },
};

export default function Page() {
  return <ProductPage data={data} />;
}

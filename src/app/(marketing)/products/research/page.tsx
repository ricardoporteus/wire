import type { Metadata } from "next";
import { ProductPage, type ProductData } from "../../_components/ProductPage";
import { Bar, Rail } from "../../_components/Mock";

export const metadata: Metadata = {
  title: "Research — Mavrix",
  description: "Scout measures what your market actually searches every month: real search volume, difficulty and rising trends. Then hands you a ranked queue of ideas. Know exactly what to write, before you write it.",
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
          <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>Measured 903 searches · kept 30</span></div>
        </div>
        <div className="scrf"><span>Ideas ranked</span><span className="k">12 briefs queued</span></div></div></div></div>
);

const tableMock = (
  <div className="frame"><Bar u="app.mavrix.life/keywords" />
    <div className="app"><Rail on="scout" />
      <div className="scr"><div className="scrh"><div><b>Ranked opportunities</b><span className="s">903 measured · 30 kept · 10 P1</span></div><span className="badge rank">ranked</span></div>
        <table className="tbl" style={{ marginTop: 10 }}><thead><tr><th>Keyword</th><th>Volume</th><th>KD</th><th>Priority</th></tr></thead><tbody>
          <tr><td className="kw">aeo vs seo</td><td>1,900/mo</td><td><span className="kd"><span className="track"><i style={{ width: "17%", background: "#1E7A44" }} /></span>17</span></td><td><span className="pill hi">P1</span></td></tr>
          <tr><td className="kw">answer engine optimization</td><td>2,400/mo</td><td><span className="kd"><span className="track"><i style={{ width: "43%", background: "#C9922B" }} /></span>43</span></td><td><span className="pill hi">P1</span></td></tr>
          <tr><td className="kw">how to get cited by chatgpt</td><td>110/mo</td><td><span className="kd"><span className="track"><i style={{ width: "9%", background: "#1E7A44" }} /></span>9</span></td><td><span className="pill md">P2</span></td></tr>
        </tbody></table></div></div></div>
);

const data: ProductData = {
  id: "research", avatar: "scout", persona: "Scout", role: "Research Analyst", roleColor: "#0B66A8",
  hero: {
    title: <>Know exactly what to write, <span className="hl">before you write it</span></>,
    sub: "Scout measures your whole market every month: hundreds of real searches, rising Google Trends and what your competitors actually rank for. Then hands you a ranked queue, every idea backed by real search volume. No more guessing, no more blank calendar.",
    cta: "Run a free sweep", mock: sweepMock,
  },
  pains: {
    old: ["Blank calendar. You write whatever comes to mind.", "Keyword tools dump 500 rows with no priorities.", "Competitors rank for terms you have never seen.", "Proper research eats a full day you do not have."],
    fixes: [
      { b: "A ranked queue waiting every month.", chip: "Ranked idea queue" },
      { b: "Every keyword measured: real volume, difficulty and buyer fit.", chip: "Measured, not guessed" },
      { b: "What competitors actually rank for, and you don’t.", chip: "Real competitor rankings" },
      { b: "Six stages in minutes, streamed live.", chip: "Live six-stage sweep" },
    ],
  },
  benefits: [
    { ic: "🗓️", h: "Never a blank calendar", p: "You always open the month with a queue of ideas worth writing, not a cursor blinking on an empty page." },
    { ic: "🎯", h: "Words only where they win", p: "Every keyword comes with real monthly searches and a difficulty score, so you only write what people search for and you can actually win." },
    { ic: "⚡", h: "Move while it is hot", p: "Rising Google Trends searches feed every sweep, so you catch topics this month, not after they have peaked." },
  ],
  zigs: [
    { klabel: "Benefit · a month of ideas in minutes", h: "One sweep, six stages, a full queue", p: "Scout measures hundreds of real searches, pulls rising Google Trends and competitor rankings, then runs gap, AEO and trend passes and ranks everything into briefs.", bullets: ["Hundreds of searches measured every sweep", "Streamed live so nothing feels stuck", "Ends in a ranked, ready-to-write queue"], mock: sweepMock },
    { klabel: "Benefit · only chase keywords with proof", h: "Three proofs before anything makes the list", p: "Every keyword must pass the 3-Proof Filter: people search it (real monthly volume), you can win it (0 to 100 difficulty), and your buyer types it (fit rated against your Brand Brain). What survives is ranked by opportunity.", bullets: ["Real monthly search volume on every keyword", "Close variants merged, so one piece covers them all", "The reasoning shown, not hidden"], mock: tableMock, flip: true },
  ],
  videoTitle: "Watch Scout run a sweep, start to finish",
  spec: [
    { h: "Keyword intelligence", p: "High-intent, informational and long-tail phrases, each with real search volume, difficulty and a buyer-fit score." },
    { h: "Competitor sweep", p: "What your competitors actually rank for, and the searches they own that you don’t." },
    { h: "Content gaps", p: "The topics competitors rank for that you have not covered." },
    { h: "AI search (AEO)", p: "The questions AI answer engines field, and snippet targets to win." },
    { h: "Trends", p: "Rising Google Trends searches in your market, caught while they are still climbing." },
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
    { q: "Where does the data come from?", a: "Two places. Measured search data for every keyword (monthly Google volume, difficulty, intent and trend), and live web research for competitors, gaps and trends. Every source is shown as it is read, so nothing is invented or hidden." },
    { q: "Can I run it more than monthly?", a: "Yes. The monthly sweep is automatic, and you can fire an on-demand run any time credits allow." },
    { q: "Does it work for my niche?", a: "Yes. The sweep adapts to your Brand Brain, so it researches your market and buyer, not a generic list. Very specific phrases often have too few searches to measure, so Scout finds the version people actually type and measures that." },
  ],
  crossIntro: "Research is where it starts. The queue Scout builds flows straight to the others.",
  closing: { h: "Run your first sweep in the next five minutes", p: "Free to start. Watch Scout fill your queue before you finish your coffee." },
};

export default function Page() {
  return <ProductPage data={data} />;
}

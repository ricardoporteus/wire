import type { Metadata } from "next";
import { ProductPage, type ProductData } from "../../_components/ProductPage";
import { Bar, Rail } from "../../_components/Mock";

export const metadata: Metadata = {
  title: "SEO & AEO — Mavrix",
  description: "Ada scores every idea for difficulty and intent, then optimises each draft to win Google and the AI answer engines. Only write what can actually rank.",
  alternates: { canonical: "/products/seo" },
};

const tableMock = (
  <div className="frame"><Bar u="app.mavrix.life/keywords" />
    <div className="app"><Rail on="ada" />
      <div className="scr"><div className="scrh"><div><b>Ranked opportunities</b><span className="s">34 scored · 11 high-intent</span></div><span className="badge rank">ranked</span></div>
        <table className="tbl" style={{ marginTop: 10 }}><thead><tr><th>Keyword</th><th>Intent</th><th>KD</th><th>Priority</th></tr></thead><tbody>
          <tr><td className="kw">ai content workflow</td><td><span className="pill buy">Buyer</span></td><td><span className="kd"><span className="track"><i style={{ width: "32%", background: "#1E7A44" }} /></span>32</span></td><td><span className="pill hi">High</span></td></tr>
          <tr><td className="kw">get cited by ai search</td><td><span className="pill hi">Info</span></td><td><span className="kd"><span className="track"><i style={{ width: "21%", background: "#1E7A44" }} /></span>21</span></td><td><span className="pill hi">High</span></td></tr>
          <tr><td className="kw">seo for startups</td><td><span className="pill buy">Buyer</span></td><td><span className="kd"><span className="track"><i style={{ width: "54%", background: "#C9922B" }} /></span>54</span></td><td><span className="pill md">Medium</span></td></tr>
          <tr><td className="kw">content repurposing tool</td><td><span className="pill buy">Buyer</span></td><td><span className="kd"><span className="track"><i style={{ width: "61%", background: "#C9922B" }} /></span>61</span></td><td><span className="pill md">Medium</span></td></tr>
        </tbody></table></div></div></div>
);

const aeoMock = (
  <div className="frame"><Bar u="app.mavrix.life/audit" />
    <div className="app"><Rail on="ada" />
      <div className="scr"><div className="scrh"><div><b>AEO readiness</b><span className="s">The founder&apos;s guide to AI search</span></div><span className="badge rank">92 / 100</span></div><div className="prog"><i style={{ width: "92%" }} /></div>
        <div className="lines">
          <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>Answers 6 of 6 target questions</span></div>
          <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>Snippet-formatted intro and summary</span></div>
          <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>Schema and headings structured to parse</span></div>
          <div className="ln"><span className="dt" style={{ background: "#C9922B" }} /><span>1 claim needs a source citation</span></div>
        </div>
        <div className="scrf"><span>Ready to publish</span><span className="k">6 snippet targets</span></div></div></div></div>
);

const data: ProductData = {
  id: "seo", avatar: "ada", persona: "Ada", role: "SEO & AEO Strategist", roleColor: "#3F6212",
  hero: {
    title: <>Only write what can <span className="hl">actually rank</span></>,
    sub: "Ada scores every idea for difficulty and intent, then optimises each draft to win Google and the AI answer engines. No more publishing into the void.",
    cta: "Score my ideas", mock: tableMock,
  },
  pains: {
    old: ["You publish and it never ranks.", "Tools give volume, not whether you can win.", "You optimise for Google and ignore AI answers.", "SEO advice is vague and never draft-specific."],
    fixes: [
      { b: "Every idea scored before you commit a word.", chip: "Difficulty scoring" },
      { b: "Ranked by real opportunity, not raw volume.", chip: "Opportunity ranking" },
      { b: "Optimised for AI answers, not just blue links.", chip: "AEO optimisation" },
      { b: "Every draft audited on-page before it ships.", chip: "Draft SEO audit" },
    ],
  },
  benefits: [
    { ic: "🎯", h: "Stop writing into the void", p: "Pursue only the keywords you can realistically win, scored before you spend a single draft." },
    { ic: "🤖", h: "Show up in AI answers", p: "Get cited where buyers now ask their questions, not just in the ten blue links." },
    { ic: "✅", h: "Every draft ships optimised", p: "No post-hoc SEO scramble. Each piece is audited for search and AEO before it goes live." },
  ],
  zigs: [
    { klabel: "Benefit · only chase winnable keywords", h: "Scored and ranked, not just listed", p: "Every idea gets an intent label and a difficulty score, ordered so the highest-opportunity work sits at the top.", bullets: ["Buyer vs informational intent tagged", "Difficulty scored, priority ranked", "The reasoning shown, not hidden"], mock: tableMock },
    { klabel: "Benefit · get quoted by AI search", h: "Optimised for the answer engines", p: "Ada audits each draft against the questions AI engines answer, then scores its readiness before you publish.", bullets: ["Target questions covered and formatted", "Snippet and schema structure checked", "Unsupported claims flagged for a source"], mock: aeoMock, flip: true },
  ],
  videoTitle: "Watch Ada score a month of ideas",
  spec: [
    { h: "Difficulty scoring", p: "Every keyword rated for how hard it is to rank, so you pick winnable fights." },
    { h: "Intent classification", p: "Buyer, informational or navigational, so effort matches the goal." },
    { h: "Opportunity ranking", p: "Ideas ordered by real upside, not raw search volume." },
    { h: "AEO optimisation", p: "Shaped for the questions AI answer engines actually field." },
    { h: "Snippet targeting", p: "Formatting and structure aimed at featured snippets and citations." },
    { h: "On-page draft audit", p: "Each draft checked for on-page and AEO gaps before it ships." },
  ],
  testimonials: [
    { quote: "“We finally stopped publishing posts that never ranked. Ada tells us upfront.”", ini: "JK", iniBg: "#A9DBFF", role: "Founder, B2B SaaS" },
    { quote: "“Two of our pages are now cited in AI answers. That was never on our radar.”", ini: "SM", iniBg: "#DBFE7A", role: "Head of growth" },
    { quote: "“The draft audit catches what our old SEO checklist always missed.”", ini: "AO", iniBg: "#FFECD3", role: "Content lead" },
  ],
  cases: [
    { co: "B2B SaaS blog · 20 posts", title: "From page three to page one", metrics: [{ b: "8", span: "keywords to page 1" }, { b: "3×", span: "organic clicks" }], problem: "A backlog of posts targeting terms too competitive to ever rank.", withText: "Re-scored the backlog, refocused on winnable, high-intent terms.", result: "Eight keywords reached page one within the quarter." },
    { co: "Fintech startup · new content program", title: "Cited in AI answers within six weeks", metrics: [{ b: "6 wks", span: "to first AI citation" }, { b: "6", span: "snippet targets won" }], problem: "Buyers increasingly asked AI assistants, and the brand never showed up.", withText: "Optimised each piece for answer-engine questions and snippet structure.", result: "First AI citations within six weeks, six snippet targets won." },
  ],
  faq: [
    { q: "How is difficulty scored?", a: "Ada weighs how competitive a term is against your site, so the score reflects what you can realistically win, not a generic number." },
    { q: "What is AEO?", a: "Answer-engine optimisation: shaping content so AI assistants quote it. Ada targets the questions those engines field and checks snippet and schema structure." },
    { q: "Does it audit my existing drafts?", a: "Yes. Paste or import a draft and Ada returns an on-page and AEO readiness score with specific fixes." },
    { q: "Do I need an SEO background?", a: "No. Ada does the scoring and the audit; you just act on a short, ranked list of fixes." },
  ],
  crossIntro: "Ada scores the ideas Scout finds, then hands the winners to the writer.",
  closing: { h: "See what you can actually rank for", p: "Free to start. Score your first month of ideas in seconds." },
};

export default function Page() {
  return <ProductPage data={data} />;
}

import type { Metadata } from "next";
import { ProductPage, type ProductData } from "../../_components/ProductPage";
import { Bar, Rail } from "../../_components/Mock";

export const metadata: Metadata = {
  title: "SEO & AEO — Mavrix",
  description: "Ada backs every keyword with real search volume and a 0 to 100 difficulty score, checks Google’s live page one, then shapes each piece to win Google and AI answers. Only write what can actually rank.",
  alternates: { canonical: "/products/seo" },
};

const tableMock = (
  <div className="frame"><Bar u="app.mavrix.life/keywords" />
    <div className="app"><Rail on="ada" />
      <div className="scr"><div className="scrh"><div><b>Ranked opportunities</b><span className="s">903 measured · 30 kept · 10 P1</span></div><span className="badge rank">ranked</span></div>
        <table className="tbl" style={{ marginTop: 10 }}><thead><tr><th>Keyword</th><th>Volume</th><th>KD</th><th>Priority</th></tr></thead><tbody>
          <tr><td className="kw">aeo vs seo</td><td>1,900/mo</td><td><span className="kd"><span className="track"><i style={{ width: "17%", background: "#1E7A44" }} /></span>17</span></td><td><span className="pill hi">P1</span></td></tr>
          <tr><td className="kw">answer engine optimization</td><td>2,400/mo</td><td><span className="kd"><span className="track"><i style={{ width: "43%", background: "#C9922B" }} /></span>43</span></td><td><span className="pill hi">P1</span></td></tr>
          <tr><td className="kw">how to get cited by chatgpt</td><td>110/mo</td><td><span className="kd"><span className="track"><i style={{ width: "9%", background: "#1E7A44" }} /></span>9</span></td><td><span className="pill md">P2</span></td></tr>
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
    sub: "Ada backs every idea with real search volume and a 0 to 100 difficulty score, checks what Google’s page one rewards right now, then optimises each draft to win Google and the AI answer engines. No more publishing into the void.",
    cta: "Score my ideas", mock: tableMock,
  },
  pains: {
    old: ["You publish and it never ranks.", "Tools give volume, not whether you can win.", "You optimise for Google and ignore AI answers.", "SEO advice is vague and never draft-specific."],
    fixes: [
      { b: "Every idea scored before you commit a word.", chip: "Difficulty scoring" },
      { b: "Ranked by real opportunity: volume, difficulty and buyer fit.", chip: "Opportunity score 0–100" },
      { b: "Optimised for AI answers, not just blue links.", chip: "AI Overview ready" },
      { b: "Every draft audited on-page before it ships.", chip: "Draft SEO audit" },
    ],
  },
  benefits: [
    { ic: "🎯", h: "Stop writing into the void", p: "Every keyword comes with real monthly searches and a measured difficulty score, so you only spend a draft on fights you can win." },
    { ic: "🤖", h: "Show up in AI answers", p: "Get cited where buyers now ask their questions, not just in the ten blue links." },
    { ic: "✅", h: "Every draft ships optimised", p: "No post-hoc SEO scramble. Each piece is audited for search and AEO before it goes live." },
  ],
  zigs: [
    { klabel: "Benefit · only chase winnable keywords", h: "Proof, not guesses: every keyword measured", p: "Every keyword gets real monthly search volume, a 0 to 100 difficulty score, a search-intent label and a buyer-fit rating. Then one opportunity score decides P1, P2 or P3.", bullets: ["Real search volume and 0 to 100 difficulty", "Intent classified from live search data", "Buyer fit rated against your Brand Brain"], mock: tableMock },
    { klabel: "Benefit · get quoted by AI search", h: "Optimised for the answer engines", p: "Ada checks Google’s live page one for your top keywords: is there an AI Overview, a People Also Ask box, a featured snippet? Then she tells you the format page one rewards and shapes each piece to be the answer.", bullets: ["Live page-one check: AI Overviews, People Also Ask, snippets", "Recommended format from what already ranks", "Unsupported claims flagged for a source"], mock: aeoMock, flip: true },
  ],
  videoTitle: "Watch Ada score a month of ideas",
  spec: [
    { h: "Difficulty scoring", p: "Every keyword rated 0 to 100 from the strength of the pages already ranking: under 30 low, 30 to 59 medium, 60+ high." },
    { h: "Intent classification", p: "Buyer, commercial, informational or navigational, classified from live search data." },
    { h: "Opportunity ranking", p: "One 0 to 100 score from buyer fit, volume, difficulty, intent and page one. Not raw volume." },
    { h: "AEO optimisation", p: "Shaped for the questions AI answer engines actually field." },
    { h: "AI Overview & snippet targeting", p: "In our testing, 29 of 30 results pages showed an AI Overview. Ada targets the answer boxes that actually appear." },
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
    { q: "How is difficulty scored?", a: "Every keyword gets a 0 to 100 difficulty score measured from the strength of the pages already on Google’s first page: under 30 is low, 30 to 59 medium, 60+ high. Ada combines it with search volume, intent and fit with your buyer, so the ranking reflects what’s worth winning, not just what’s easy." },
    { q: "What is AEO?", a: "Answer-engine optimisation: shaping content so AI assistants and Google’s AI Overviews quote it. Ada pulls the real People Also Ask questions from Google, checks whether an AI Overview appears, and structures each piece to be the answer." },
    { q: "Where do the search volumes come from?", a: "Measured search data: monthly Google volume for your main market, refreshed every sweep. If a number can’t be measured, it’s labelled as an estimate." },
    { q: "Does it audit my existing drafts?", a: "Yes. Paste or import a draft and Ada returns an on-page and AEO readiness score with specific fixes." },
    { q: "Do I need an SEO background?", a: "No. Ada does the scoring and the audit; you just act on a short, ranked list of fixes." },
  ],
  crossIntro: "Ada scores the ideas Scout finds, then hands the winners to the writer.",
  closing: { h: "See what you can actually rank for", p: "Free to start. See real search volume and difficulty for your first month of ideas in minutes." },
};

export default function Page() {
  return <ProductPage data={data} />;
}

import type { Metadata } from "next";
import { ProductPage, type ProductData } from "../../_components/ProductPage";
import { Bar, Rail } from "../../_components/Mock";

export const metadata: Metadata = {
  title: "Writer — Mavrix",
  description: "Quill writes long-form to your brand and a hundred small rules most AI breaks, then reshapes each piece for every channel. Drafts you edit, not rewrite.",
  alternates: { canonical: "/products/writer" },
};

const editorMock = (
  <div className="frame"><Bar u="app.mavrix.life/write" />
    <div className="app"><Rail on="quill" />
      <div className="scr"><div className="wr">
        <div className="doc"><div className="t">The founder&apos;s guide to AI search visibility</div>
          <p>Buyers no longer start every search on Google. A growing share ask an AI assistant, and the brands that get quoted are the ones structured to be cited.</p>
          <div className="bars"><i style={{ width: "100%" }} /><i style={{ width: "96%" }} /><i style={{ width: "98%" }} /><i style={{ width: "72%" }} /></div>
          <p style={{ marginTop: 12 }}>Here is how to earn those citations without a full content team.</p>
          <div className="bars"><i style={{ width: "100%" }} /><i style={{ width: "88%" }} /></div>
        </div>
        <div className="check"><h5>Draft check</h5>
          <div className="row">Em dashes <span className="ok">0</span></div>
          <div className="row">Banned terms <span className="ok">clear</span></div>
          <div className="row">Voice match <span className="ok">on brand</span></div>
          <div className="row">Sources cited <span className="ok">7</span></div>
          <div className="wc"><b>812</b><span>words, measured</span></div>
        </div></div></div></div></div>
);

const packMock = (
  <div className="frame"><Bar u="app.mavrix.life/repurpose" />
    <div className="app"><Rail on="quill" />
      <div className="scr"><div className="scrh"><div><b>Repurpose pack</b><span className="s">One article, four channels, one pass</span></div><span className="badge live">ready</span></div>
        <div className="pack" style={{ marginTop: 14 }}>
          <div className="pk"><div className="h"><span className="ic" style={{ background: "#0B66A8" }}>in</span>LinkedIn article</div><div className="bars"><i style={{ width: "100%" }} /><i style={{ width: "92%" }} /><i style={{ width: "80%" }} /></div><span className="tag2">600 to 900 words, feed-shaped</span></div>
          <div className="pk"><div className="h"><span className="ic" style={{ background: "#0B66A8" }}>in</span>LinkedIn post</div><div className="bars"><i style={{ width: "100%" }} /><i style={{ width: "70%" }} /></div><span className="tag2">120 to 220 words, one idea</span></div>
          <div className="pk"><div className="h"><span className="ic" style={{ background: "#8A5A1B" }}>@</span>Newsletter block</div><div className="bars"><i style={{ width: "90%" }} /><i style={{ width: "100%" }} /><i style={{ width: "64%" }} /></div><span className="tag2">Subject line plus teaser</span></div>
          <div className="pk"><div className="h"><span className="ic" style={{ background: "#1E7A44" }}>md</span>Markdown export</div><div className="bars"><i style={{ width: "100%" }} /><i style={{ width: "96%" }} /></div><span className="tag2">Straight into your CMS</span></div>
        </div></div></div></div>
);

const data: ProductData = {
  id: "writer", avatar: "quill", persona: "Quill", role: "Senior Copywriter", roleColor: "#1E7A44",
  hero: {
    title: <>Drafts you edit, <span className="hl">not rewrite</span></>,
    sub: "Quill writes long-form to your brand and a hundred small rules most AI breaks, then reshapes each piece for every channel. You edit, you never start from a blank page.",
    cta: "Write my first draft", mock: editorMock,
  },
  pains: {
    old: ["AI drafts need a full rewrite, not an edit.", "Every piece is reshaped by hand for each channel.", "Wrong word counts and em dashes everywhere.", "The draft ignores your brand and your facts."],
    fixes: [
      { b: "Drafts written to your brand, ready to edit.", chip: "Brand-trained writer" },
      { b: "One piece reshaped into a channel pack in a pass.", chip: "Channel repurposing" },
      { b: "Real word counts, no em dashes, every time.", chip: "Rule enforcement" },
      { b: "Built from approved facts and positioning.", chip: "Brand-aware drafting" },
    ],
  },
  benefits: [
    { ic: "✍️", h: "Edit, don't rewrite", p: "Drafts land close enough to ship that you are editing, not starting over. Publish in a fraction of the time." },
    { ic: "🔁", h: "Everywhere the same day", p: "Each piece becomes a full channel pack in one pass, so it ships to every channel at once." },
    { ic: "📏", h: "Rules that actually hold", p: "The hundred small things, no em dashes, real word counts, banned terms, enforced on every draft." },
  ],
  zigs: [
    { klabel: "Benefit · edit, don't rewrite", h: "Long-form to your brand, checked as it writes", p: "Quill drafts against the brand Iris approved and runs a live draft-check, so what you get back is edit-ready, not a first-pass mess.", bullets: ["Written to your voice and approved facts", "No em dashes, word counts measured from the draft", "Leave a note and it revises that, not the whole piece"], mock: editorMock },
    { klabel: "Benefit · everywhere the same day", h: "One piece, a whole channel pack", p: "Ask for the formats you need and Quill reshapes the piece for each, with its own hook and length, in a single pass.", bullets: ["A brief per channel, not a copy-paste", "LinkedIn, newsletter and CMS-ready markdown", "Generated together, so it ships the same day"], mock: packMock, flip: true },
  ],
  videoTitle: "Watch Quill draft and repurpose a piece",
  spec: [
    { h: "Long-form drafting", p: "Full articles written around a measured target keyword, with its close variants covered in the same piece." },
    { h: "Brand-aware writing", p: "Every draft written against the voice and facts you approved." },
    { h: "Draft-check panel", p: "Em dashes, word count, banned terms and voice, checked as it writes." },
    { h: "Channel repurposing", p: "One piece into a pack: LinkedIn, newsletter, markdown, each with its own brief." },
    { h: "Note-based revisions", p: "Leave a note and it revises that line, not the whole piece." },
    { h: "Markdown / CMS export", p: "Clean markdown that drops straight into your CMS." },
  ],
  testimonials: [
    { quote: "“For the first time the draft is an edit, not a rewrite. It saves me hours.”", ini: "JK", iniBg: "#C5EFD4", role: "Founder, B2B SaaS" },
    { quote: "“One article becomes a week of posts and a newsletter, in one pass.”", ini: "SM", iniBg: "#A9DBFF", role: "Solo marketer" },
    { quote: "“No more em dashes, no more wrong word counts. It just follows our rules.”", ini: "AO", iniBg: "#DBFE7A", role: "Content lead" },
  ],
  cases: [
    { co: "Solo founder · weekly publishing", title: "From one draft a fortnight to three a week", metrics: [{ b: "6×", span: "publishing pace" }, { b: "~2 hrs", span: "saved per piece" }], problem: "Every AI draft needed a full rewrite, so publishing stalled at one piece a fortnight.", withText: "Drafts landed edit-ready, on brand, so editing replaced rewriting.", result: "Publishing pace rose to three pieces a week without extra hours." },
    { co: "Two-person marketing team", title: "One article, a full week of channels", metrics: [{ b: "1 → 5", span: "assets per article" }, { b: "same day", span: "time to ship" }], problem: "Reshaping each article for LinkedIn, newsletter and the blog ate a full day.", withText: "Each piece generated its channel pack in one pass, each with its own brief.", result: "One article became five channel-ready assets, shipping the same day." },
  ],
  faq: [
    { q: "How is this different from a normal AI writer?", a: "Quill writes against your approved Brand Brain and runs a live draft-check for em dashes, word count, banned terms and voice, so drafts come back edit-ready, not raw." },
    { q: "Will it sound like me?", a: "Yes. It writes to the voice and approved facts in your Brand Brain, not the model's default tone." },
    { q: "How do revisions work?", a: "Leave a note on the part you want changed and Quill revises that, not the whole piece, so edits stay surgical." },
    { q: "What formats can it repurpose into?", a: "LinkedIn articles and posts, newsletter blocks and CMS-ready markdown, each written to its own brief rather than copy-pasted." },
    { q: "Does Quill know which keywords to target?", a: "Yes. Each brief carries a keyword with its real monthly search volume, the close variants to cover, and the format Google’s page one rewards, so the draft is built to rank from the first line." },
  ],
  crossIntro: "Quill writes what Scout found, Ada scored and Iris approved.",
  closing: { h: "Get a draft you can actually edit", p: "Free to start. Write your first piece to your brand in minutes." },
};

export default function Page() {
  return <ProductPage data={data} />;
}

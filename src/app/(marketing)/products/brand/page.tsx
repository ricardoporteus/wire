import type { Metadata } from "next";
import { ProductPage, type ProductData } from "../../_components/ProductPage";
import { Bar, Rail } from "../../_components/Mock";

export const metadata: Metadata = {
  title: "Brand — Mavrix",
  description: "Iris learns your voice, ICP, positioning and banned words once, then holds every draft to it. A consistent brand, without you proofreading each piece.",
  alternates: { canonical: "/products/brand" },
};

const brainMock = (
  <div className="frame"><Bar u="app.mavrix.life/brand" />
    <div className="app"><Rail on="iris" />
      <div className="scr"><div className="scrh"><div><b>Brand Brain</b><span className="s">Approved · v3</span></div><span className="badge live">active</span></div>
        <div className="bb" style={{ marginTop: 14 }}>
          <div className="fld"><label>Voice</label><div className="chips2"><span>Direct</span><span>Warm</span><span>Expert</span><span>No hype</span></div></div>
          <div className="fld"><label>Ideal customer</label><div className="box">Seed to Series B founders running lean, selling B2B software.</div></div>
          <div className="fld"><label>Banned words</label><div className="chips2"><span className="ban">revolutionary</span><span className="ban">cure</span><span className="ban">synergy</span><span className="ban">unlock</span></div></div>
        </div></div></div></div>
);

const checkMock = (
  <div className="frame"><Bar u="app.mavrix.life/brand/check" />
    <div className="app"><Rail on="iris" />
      <div className="scr"><div className="scrh"><div><b>Brand check</b><span className="s">Enforcing Brand Brain v3</span></div><span className="badge live">on</span></div>
        <div className="lines" style={{ marginTop: 12 }}>
          <div className="ln"><span className="dt" style={{ background: "#B42324" }} /><span>Blocked: &ldquo;revolutionary&rdquo; → suggest &ldquo;proven&rdquo;</span></div>
          <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>Voice match: direct, no hype</span></div>
          <div className="ln"><span className="dt" style={{ background: "#1E7A44" }} /><span>Positioning: aligned to approved ICP</span></div>
          <div className="ln"><span className="dt" style={{ background: "#C9922B" }} /><span>1 claim needs an approved fact</span></div>
        </div>
        <div className="scrf"><span>Guardrails held</span><span className="k">2 fixes applied</span></div></div></div></div>
);

const data: ProductData = {
  id: "brand", avatar: "iris", persona: "Iris", role: "Brand Guardian", roleColor: "#8A5A1B",
  hero: {
    title: <>Nothing off-brand ever <span className="hl">leaves the building</span></>,
    sub: "Iris learns your voice, ICP, positioning and banned words once, then holds every draft to it. A consistent brand, without you proofreading each piece.",
    cta: "Build my Brand Brain", mock: brainMock,
  },
  pains: {
    old: ["Every writer sounds like a different company.", "You proofread every piece for off-brand slips.", "Your positioning lives in a doc nobody opens.", "Banned words still sneak into drafts."],
    fixes: [
      { b: "One Brand Brain every draft is checked against.", chip: "Brand Brain" },
      { b: "Voice and positioning enforced automatically.", chip: "Voice enforcement" },
      { b: "Positioning applied to every piece, not filed away.", chip: "Live positioning" },
      { b: "Banned terms blocked on whole words.", chip: "Banned-term guardrails" },
    ],
  },
  benefits: [
    { ic: "🎙️", h: "Sound like one company", p: "Every piece, on every channel, in the same voice, no matter who or what wrote it." },
    { ic: "🛡️", h: "Stop proofreading for brand", p: "The guardrails hold automatically, so you are not the last line of defence on every draft." },
    { ic: "🧭", h: "Your positioning, not the model's", p: "Drafts are built from approved facts and positioning, not whatever the model assumes." },
  ],
  zigs: [
    { klabel: "Benefit · sound like one company", h: "A Brand Brain, approved once", p: "Iris captures your voice, ICP, positioning and banned words in a single profile, and applies it to everything the team writes.", bullets: ["Voice, ICP and positioning in one place", "You sign it off before anything ships", "Applied to every draft, every channel"], mock: brainMock },
    { klabel: "Benefit · guardrails that actually hold", h: "Off-brand caught before it ships", p: "Every draft runs against the Brand Brain. Banned terms are blocked on whole words, and anything off-voice is flagged and fixed.", bullets: ["Whole-word blocking, so “secure” survives “cure”", "Voice and positioning checked, not assumed", "Unsupported claims flagged for an approved fact"], mock: checkMock, flip: true },
  ],
  videoTitle: "Watch Iris build and enforce a Brand Brain",
  spec: [
    { h: "Voice profile", p: "Your tone captured as rules the writer follows, not a vibe it guesses." },
    { h: "ICP & positioning", p: "Who you sell to and how you are different, applied to every draft." },
    { h: "Banned words", p: "Terms you never want to see, blocked on whole words." },
    { h: "Approved facts", p: "The claims you stand behind, so nothing gets invented." },
    { h: "Whole-word enforcement", p: "Blocking “cure” never mangles “secure”. Precision, not find-and-replace." },
    { h: "Sign-off checkpoints", p: "You approve the brand before anyone writes a line." },
  ],
  testimonials: [
    { quote: "“Everything finally sounds like us, even the pieces I never touched.”", ini: "JK", iniBg: "#FFECD3", role: "Founder, B2B SaaS" },
    { quote: "“I stopped being the brand police. Iris catches the slips I used to.”", ini: "SM", iniBg: "#A9DBFF", role: "Head of brand" },
    { quote: "“Our banned-words list actually gets enforced now, not just circulated.”", ini: "AO", iniBg: "#DBFE7A", role: "Marketing lead" },
  ],
  cases: [
    { co: "Scale-up · 5 writers, 3 channels", title: "One voice across a growing team", metrics: [{ b: "5", span: "writers, one voice" }, { b: "0", span: "brand-review rounds" }], problem: "Five contributors, five subtly different voices, endless brand-review loops.", withText: "One approved Brand Brain enforced on every draft before review.", result: "Consistent voice across the team, brand-review rounds effectively gone." },
    { co: "Regulated fintech · compliance-sensitive", title: "Banned claims caught before publish", metrics: [{ b: "100%", span: "drafts checked" }, { b: "0", span: "banned claims shipped" }], problem: "Compliance-sensitive claims occasionally slipped into published copy.", withText: "Banned terms and unsupported claims blocked on whole words, every draft.", result: "Every draft checked automatically; no banned claims reached publish." },
  ],
  faq: [
    { q: "How does Iris learn my brand?", a: "A short onboarding captures your voice, ICP, positioning and banned words. You review and approve the Brand Brain before it is used." },
    { q: "What does whole-word enforcement mean?", a: "Banned terms are matched as whole words, so blocking “cure” never mangles “secure”. It is precision, not blunt find-and-replace." },
    { q: "Can I update the brand later?", a: "Yes. The Brand Brain is versioned. Update voice, facts or banned words any time and it applies to new drafts." },
    { q: "Does it work across multiple brands?", a: "On the right plan, yes. Each brand gets its own Brain, so agencies and portfolios keep every client distinct." },
  ],
  crossIntro: "Iris sets the standard. The others research, score and write to it.",
  closing: { h: "Set the standard once. Hold it forever.", p: "Free to start. Build your Brand Brain in a single onboarding." },
};

export default function Page() {
  return <ProductPage data={data} />;
}

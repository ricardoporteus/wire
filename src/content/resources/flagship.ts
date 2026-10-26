import type { Article } from "./types";

/**
 * The hub feature piece and the AI Search pillar. Fully authored to show the
 * exact structure Mavrix writes to: a 40-word answer up top (snippet/AI-Overview
 * bait), clean H2/H3 hierarchy, extractable lists and tables, a sourced table,
 * contextual internal links, and an FAQ that powers FAQPage schema.
 */
export const FLAGSHIP: Article = {
  slug: "answer-engine-optimization",
  category: "ai-search",
  type: "deep-dive",
  featured: true,
  pillar: true,
  title: "Answer Engine Optimization (AEO): How to Get Cited by ChatGPT and Google AI Overviews",
  excerpt:
    "AI answers now sit above the blue links. This is the complete AEO playbook: what answer engine optimization is, how ChatGPT, Google AI Overviews and Perplexity decide what to cite, and the 7 steps to become the answer they quote.",
  targetKeyword: "answer engine optimization",
  author: "ada",
  datePublished: "2026-10-20",
  dateModified: "2026-10-26",
  readingMinutes: 11,
  tags: ["AEO", "AI Overviews", "ChatGPT", "generative engine optimization", "SEO"],
  related: ["get-cited-by-chatgpt", "aeo-vs-seo", "topic-clusters-seo", "ai-visibility-metrics"],
  body: [
    { k: "p", html: "Search no longer ends with a list of blue links. ChatGPT answers the question outright. Google puts an AI Overview above the results. Perplexity writes a sourced paragraph and footnotes a handful of pages. Your buyers increasingly read the answer, not the ranking, and the only question that matters is whether the answer quotes you." },
    { k: "p", html: "That shift has a name: <strong>answer engine optimization</strong>. This guide covers what it is, how AI engines actually choose their sources, and a seven-part playbook you can run this quarter to become the page they cite." },

    { k: "h2", text: "What is answer engine optimization (AEO)?", id: "what-is-aeo" },
    { k: "p", html: "Answer engine optimization (AEO) is the practice of structuring your content so AI answer engines, such as ChatGPT, Google AI Overviews, Perplexity and Gemini, select and cite it when they generate a direct answer. Where traditional SEO competes for a position on the page, AEO competes to be the source inside the answer itself." },
    { k: "callout", title: "AEO, GEO, the same job", html: "You will also see <strong>generative engine optimization (GEO)</strong>. The terms are used interchangeably: both describe earning citations inside AI-generated answers. We use AEO throughout this library." },

    { k: "h2", text: "AEO vs SEO: what actually changes", id: "aeo-vs-seo" },
    { k: "p", html: "AEO does not replace SEO, it extends it. The same crawlable, authoritative, well-structured page that ranks on Google is the one an answer engine is most likely to quote. What changes is the unit you optimize for: a cited sentence, not a clicked result. For the full side-by-side, read our <a href=\"/resources/seo/aeo-vs-seo\">AEO vs SEO comparison</a>." },
    {
      k: "table",
      head: ["", "Traditional SEO", "Answer Engine Optimization"],
      rows: [
        ["Goal", "Rank in the ten blue links", "Be the cited source in the answer"],
        ["Unit", "The page", "The passage or sentence"],
        ["Winner's reward", "The click", "The citation and the mention"],
        ["Format that wins", "Comprehensive page", "Extractable, direct, well-structured passage"],
        ["Measured by", "Position, clicks, impressions", "Citations, mentions, share of answer"],
      ],
    },

    { k: "h2", text: "How AI engines choose what to cite", id: "how-engines-choose" },
    { k: "p", html: "Answer engines run a retrieval step, then a generation step. Understanding both tells you where to intervene." },
    { k: "h3", text: "1. Retrieval: can it find and trust you", id: "retrieval" },
    { k: "p", html: "Most engines pull live results (often from a search index) before writing. If you are not crawlable, fast and already visible for the query, you are not in the candidate set. Classic technical and on-page SEO is the price of entry." },
    { k: "h3", text: "2. Relevance: does the passage answer the question", id: "relevance" },
    { k: "p", html: "The model favors passages that answer the specific question cleanly and early. A 40-word definition at the top of a section is far more quotable than the same fact buried in paragraph nine." },
    { k: "h3", text: "3. Authority and consensus", id: "authority" },
    { k: "p", html: "When several trusted sources agree, the engine is more confident citing the claim, and more likely to cite the source that stated it most clearly. Mentions and citations across the web, not just backlinks, feed this." },
    { k: "h3", text: "4. Structure: can it be extracted", id: "structure" },
    { k: "p", html: "Headings that match questions, short definitional openers, lists, tables and FAQ blocks all make a passage easy to lift. Structure is the single most controllable AEO lever." },

    { k: "h2", text: "The 7-part AEO playbook", id: "playbook" },
    { k: "p", html: "Run these in order. The first three win citations fastest; the last four compound." },
    {
      k: "ol",
      items: [
        "<strong>Answer in the first 40 words.</strong> Open each section with a direct, self-contained answer to the question in its heading. This is the passage engines lift.",
        "<strong>Structure for extraction.</strong> Use question-shaped H2s and H3s, short paragraphs, lists and at least one comparison table. Add an FAQ for the long-tail questions.",
        "<strong>Target question keywords and People Also Ask.</strong> Write for how people ask, not just what they type. Pull real questions from the People Also Ask box and answer each in its own section.",
        "<strong>Build topical authority with clusters.</strong> One pillar page plus linked cluster articles tells engines you cover the topic deeply. See our guide to <a href=\"/resources/seo/topic-clusters-seo\">topic clusters</a>.",
        "<strong>Earn mentions, not just links.</strong> Consistent, citable claims across the web raise the odds an engine trusts yours. Original data and clear definitions get quoted.",
        "<strong>Keep facts current and sourced.</strong> Answer engines discount stale pages. Date your content, cite primary sources, and refresh on a schedule.",
        "<strong>Measure your AI visibility.</strong> Track which answers cite you and for which prompts. Start with our guide to <a href=\"/resources/ai-search/ai-visibility-metrics\">measuring AI visibility</a>.",
      ],
    },

    { k: "h2", text: "A worked example: the passage an engine would quote", id: "worked-example" },
    { k: "p", html: "Compare two openers for a section titled \"How much does AEO cost?\"" },
    { k: "quote", text: "Weak: There are many factors that influence the cost of an answer engine optimization program, and it really depends on your situation and goals.", cite: "Not quotable, no answer" },
    { k: "quote", text: "Strong: Answer engine optimization typically costs nothing extra beyond good SEO: it is a way of structuring content, not a separate tool. Teams that outsource it pay from roughly $500 to $5,000 per month depending on content volume.", cite: "Quotable, answers in the first sentence" },

    { k: "h2", text: "How to know it is working", id: "measurement" },
    { k: "ul", items: [
      "Citations: how often your domain appears as a source in AI answers for your target prompts.",
      "Share of answer: of the prompts in your market, what fraction cite you versus competitors.",
      "Assisted traffic: referrals from ChatGPT, Perplexity and AI Overviews in your analytics.",
      "Brand mentions: unlinked and linked references across the web that feed consensus.",
    ] },
    { k: "p", html: "If you only track rankings, you are measuring the old game. Pair position data with citation tracking. For practical, no-tool ways to check, see <a href=\"/resources/ai-search/get-cited-by-chatgpt\">how to get cited by ChatGPT</a>." },

    { k: "h2", text: "Where Mavrix fits", id: "mavrix" },
    { k: "p", html: "Mavrix runs this playbook as a workflow. It measures the real search volume behind each question, checks Google's live page one for AI Overviews and People Also Ask, then writes each piece in the extractable structure engines quote, held to your brand. See <a href=\"/how-it-works\">how it works</a> or the <a href=\"/products/seo\">SEO &amp; AEO</a> product." },
  ],
  faq: [
    { q: "What is answer engine optimization in simple terms?", a: "It is structuring your content so AI answer engines like ChatGPT and Google AI Overviews quote it as a source. Instead of competing for a ranking, you compete to be the cited answer." },
    { q: "Is AEO the same as GEO?", a: "Effectively yes. Generative engine optimization (GEO) and answer engine optimization (AEO) both describe earning citations inside AI-generated answers. The terms are used interchangeably." },
    { q: "Does AEO replace SEO?", a: "No. AEO extends SEO. A crawlable, authoritative, well-structured page is both the one that ranks and the one an engine is most likely to cite. You do the SEO groundwork, then structure for extraction." },
    { q: "How do I get cited by ChatGPT and AI Overviews?", a: "Answer the question in the first 40 words of a section, use question-shaped headings, add lists, tables and an FAQ, build topical authority with a pillar-and-cluster structure, and keep facts current and sourced." },
  ],
};

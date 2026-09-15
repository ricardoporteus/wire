export const metadata = { title: "AI-Content Disclosure — Mavrix" };

export default function AiDisclosurePage() {
  return (
    <main>
      <h1 className="mt-8 text-h2 text-ink-green">AI-Content Disclosure</h1>
      <p className="text-caption text-muted">Last updated: July 17, 2026</p>

      <p>
        Mavrix uses artificial intelligence to research topics and generate written content. This page explains what that
        means so you can use the Service responsibly. It forms part of our <a href="/legal/terms">Terms of Service</a>.
      </p>

      <h2>How Mavrix produces content</h2>
      <ul>
        <li>Mavrix runs automated research, including web searches, to gather topics, keywords, and competitor signals.</li>
        <li>It uses large-language-model (AI) systems to draft, revise, and repurpose content.</li>
        <li>Drafts are grounded in your Brand Brain (your voice, values, and approved facts) and the source material you supply, plus deterministic checks for banned terms and formatting.</li>
      </ul>

      <h2>What AI can and cannot do</h2>
      <p>
        AI-generated text can be fluent and useful, but it is produced by predicting language, not by verifying truth.
        Outputs may:
      </p>
      <ul>
        <li>contain factual errors, outdated information, or invented details (&ldquo;hallucinations&rdquo;);</li>
        <li>misstate figures, dates, names, or claims about your company or others;</li>
        <li>resemble existing published material; and</li>
        <li>reflect gaps or biases in their training data.</li>
      </ul>
      <p>
        Mavrix adds guardrails — it grounds claims in your approved facts and source material, avoids fabricating
        brand-specific specifics, and enforces your terminology rules — but <strong>these reduce, not eliminate,</strong>
        the risk of error.
      </p>

      <h2>Your responsibility: review before you publish</h2>
      <p>
        You are responsible for reviewing, fact-checking, editing, and approving every piece before you publish or rely
        on it. Treat Outputs as a first draft from a capable assistant, not as verified, ready-to-publish truth. In
        particular, independently verify statistics, quotes, claims about people or companies, legal or regulatory
        statements, and anything a reader could act on.
      </p>

      <h2>Not professional advice</h2>
      <p>
        Outputs are not legal, financial, medical, tax, or other professional advice, and using Mavrix does not create any
        professional relationship. Seek a qualified professional for advice in those areas.
      </p>

      <h2>Originality and third-party rights</h2>
      <p>
        Mavrix does not knowingly copy third-party content, but it cannot guarantee that Outputs are free of similarity to
        existing works. You are responsible for ensuring your published content does not infringe copyrights, trademarks,
        or other rights, and for running your own plagiarism or originality checks where that matters to you.
      </p>

      <h2>Disclosing AI use</h2>
      <p>
        Some platforms, audiences, and regulations expect disclosure that content was created with AI assistance. You are
        responsible for making any disclosures your context requires, and for not misrepresenting AI-generated content as
        something it is not.
      </p>

      <h2>Human oversight</h2>
      <p>
        Mavrix is designed to keep a human in the loop: it diagnoses before it writes, shows you a draft, and lets you
        revise. Please keep it that way — meaningful human review is the safeguard that makes AI-assisted content
        trustworthy.
      </p>
    </main>
  );
}

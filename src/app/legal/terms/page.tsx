export const metadata = { title: "Terms of Service — Wire" };

export default function TermsPage() {
  return (
    <main>
      <h1 className="mt-8 text-h2 text-ink-green">Terms of Service</h1>
      <p className="text-caption text-muted">Last updated: July 17, 2026</p>

      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Wire, a content-intelligence and
        content-generation platform (the &ldquo;Service&rdquo;) operated by <strong>[Wire, Inc.]</strong> (&ldquo;Wire&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account, forming an organization, or using the Service, you agree to
        these Terms on behalf of yourself and the organization you represent.
      </p>

      <h2>1. The Service</h2>
      <p>
        Wire helps marketing teams research keywords and topics and produce written content. It runs automated research
        (including web searches) and uses artificial intelligence to draft content grounded in the configuration you
        provide (your &ldquo;Brand Brain&rdquo;) and the source material you supply. AI output has inherent limits — see
        our <a href="/legal/ai-disclosure">AI-Content Disclosure</a>, which forms part of these Terms.
      </p>

      <h2>2. Accounts and organizations</h2>
      <p>
        Authentication and organizations are provided through our identity vendor. Each organization is a separate
        customer workspace; the person who creates it is responsible for the workspace, its members, and all activity
        under it. You must provide accurate information, keep your credentials secure, and are responsible for your
        members&rsquo; use. You must be at least 18 and able to form a binding contract.
      </p>

      <h2>3. Plans, credits, and billing</h2>
      <ul>
        <li>Paid plans are billed in advance through our billing and payments vendor. Fees are stated at purchase.</li>
        <li>
          Usage is metered in <strong>credits</strong>. Actions such as intelligence runs, content generation, and
          repurposing consume credits at the rates shown in the app. Credits granted with a plan are for that billing
          period; top-up credits are consumed as described at purchase.
        </li>
        <li>
          Except where required by law or expressly stated, fees and credits are <strong>non-refundable</strong>, and
          unused plan credits do not carry over. There are no lifetime or perpetual plans.
        </li>
        <li>You can cancel at any time; cancellation stops future renewals and takes effect at the end of the current period.</li>
        <li>We may change prices or plan features on reasonable notice; changes apply from your next renewal.</li>
      </ul>

      <h2>4. Your content and inputs</h2>
      <p>
        &ldquo;Inputs&rdquo; are the material you provide or direct us to process — your Brand Brain, pasted text, URLs,
        uploaded files, and similar. &ldquo;Outputs&rdquo; are the content the Service generates for you. As between you
        and Wire, <strong>you own your Inputs and your Outputs</strong>. You grant Wire a limited licence to host,
        process, and transmit your Inputs and Outputs solely to provide, secure, and improve the Service and as
        described in our <a href="/legal/privacy">Privacy Policy</a>.
      </p>
      <p>
        You are responsible for your Inputs and for reviewing and approving Outputs before use. You represent that your
        Inputs, and your use of Outputs, do not infringe others&rsquo; rights or violate law. When you direct Wire to
        ingest a website or document, you confirm you have the right to do so.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the Service to create unlawful, infringing, deceptive, or harmful content, or spam;</li>
        <li>generate content that impersonates a real person or misrepresents its AI origin where disclosure is required;</li>
        <li>ingest content you have no right to use, or scrape sources in violation of their terms or applicable law;</li>
        <li>attempt to bypass usage limits, security, or metering, or to reverse-engineer the Service;</li>
        <li>use the Service to build a competing product, or resell it except as expressly permitted by your plan.</li>
      </ul>

      <h2>6. AI-generated content</h2>
      <p>
        Outputs are produced by automated systems and may be inaccurate, incomplete, or resemble existing material. You
        are solely responsible for reviewing, fact-checking, and approving Outputs before publishing or relying on them.
        Wire is not a professional advisor and Outputs are not legal, financial, medical, or other professional advice.
        See the <a href="/legal/ai-disclosure">AI-Content Disclosure</a>.
      </p>

      <h2>7. Third-party services</h2>
      <p>
        The Service relies on third parties for authentication, hosting, databases, payments, AI model inference, and
        related functions. Your use may be subject to their terms, and their availability is outside our control. A list
        of the categories of subprocessors is in our <a href="/legal/privacy">Privacy Policy</a>.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express
        or implied, including merchantability, fitness for a particular purpose, non-infringement, and any warranty
        regarding the accuracy, originality, or results of Outputs, to the fullest extent permitted by law.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Wire will not be liable for indirect, incidental, special,
        consequential, or exemplary damages, or lost profits, revenue, or data. Wire&rsquo;s total liability arising out
        of or relating to the Service will not exceed the amounts you paid to Wire in the <strong>three months</strong>
        before the event giving rise to the claim.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate access for breach of these Terms, legal
        risk, or non-payment. On termination, your right to use the Service ends; sections that by their nature should
        survive (ownership, disclaimers, liability limits) survive.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these Terms. Material changes will be posted here with an updated date and, where appropriate,
        notified in-app or by email. Continued use after changes take effect means you accept them.
      </p>

      <h2>12. Governing law and contact</h2>
      <p>
        These Terms are governed by the laws of <strong>[jurisdiction]</strong>, without regard to conflict-of-laws
        rules. Questions: <strong>[legal@your-domain]</strong>.
      </p>
    </main>
  );
}

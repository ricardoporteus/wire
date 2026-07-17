export const metadata = { title: "Privacy Policy — Wire" };

export default function PrivacyPage() {
  return (
    <main>
      <h1 className="mt-8 text-h2 text-ink-green">Privacy Policy</h1>
      <p className="text-caption text-muted">Last updated: July 17, 2026</p>

      <p>
        This Privacy Policy explains how <strong>[Wire, Inc.]</strong> (&ldquo;Wire&rdquo;) collects, uses, and shares
        information when you use the Wire platform. It should be read with our <a href="/legal/terms">Terms of Service</a>.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account and organization data</strong> — your name, email, and organization details, handled through our authentication vendor.</li>
        <li><strong>Brand Brain configuration</strong> — the company description, audience, voice, competitors, values, and approved facts you enter.</li>
        <li><strong>Ingested source material</strong> — text you paste, URLs and files you provide, and web pages we retrieve at your direction (including competitor pages during research).</li>
        <li><strong>Generated content and usage</strong> — the outputs we produce, and metadata such as credits consumed, timestamps, and model token usage.</li>
        <li><strong>Billing data</strong> — plan and payment status. Card details are handled by our payments vendor; Wire does not store full card numbers.</li>
        <li><strong>Technical data</strong> — logs, IP address, and similar information generated when you use the Service.</li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>To provide the Service — run research, generate and repurpose content, and manage your workspace and credits.</li>
        <li>To process your Inputs through AI models to produce Outputs you request.</li>
        <li>To bill you, provide support, secure the Service, prevent abuse, and comply with law.</li>
        <li>To improve reliability and quality. We do not sell your personal information.</li>
      </ul>
      <p>
        Where required, our legal bases are performance of our contract with you, our legitimate interests in operating
        and securing the Service, your consent, and compliance with legal obligations.
      </p>

      <h2>3. AI processing of your content</h2>
      <p>
        To generate content, your Inputs (Brand Brain, source material, and instructions) are sent to our AI model
        provider for inference. We use enterprise/API access intended for business use. You are responsible for not
        submitting information you are not permitted to process, and for reviewing Outputs before use — see our{" "}
        <a href="/legal/ai-disclosure">AI-Content Disclosure</a>.
      </p>

      <h2>4. Subprocessors</h2>
      <p>We use trusted vendors to run the Service. By category, these currently include:</p>
      <ul>
        <li><strong>Authentication &amp; organizations</strong> — identity/account management.</li>
        <li><strong>Hosting &amp; delivery</strong> — application hosting and background job execution.</li>
        <li><strong>Database</strong> — managed Postgres for your workspace data.</li>
        <li><strong>AI model inference</strong> — large-language-model provider(s) used to draft content.</li>
        <li><strong>Web search / retrieval</strong> — services used to research topics and retrieve pages you direct us to.</li>
        <li><strong>Audio/video transcription</strong> — used only if you submit audio or video source material.</li>
        <li><strong>Payments</strong> — payment processing for subscriptions and top-ups.</li>
        <li><strong>Email</strong> — transactional notifications (e.g. when a run completes).</li>
      </ul>
      <p>
        A current list of named subprocessors is available on request at <strong>[privacy@your-domain]</strong>. Business
        customers who need a Data Processing Agreement should contact us.
      </p>

      <h2>5. Retention</h2>
      <p>
        We keep your workspace data for as long as your account is active and as needed to provide the Service. You can
        delete content in the app; we delete or de-identify data when it is no longer needed, subject to legal, security,
        and backup requirements. Contact us to request deletion of your account data.
      </p>

      <h2>6. Security</h2>
      <p>
        We use technical and organizational measures to protect data, including encryption in transit, access controls,
        and tenant isolation (each organization&rsquo;s data is scoped to that organization). No method of transmission or
        storage is perfectly secure.
      </p>

      <h2>7. International transfers</h2>
      <p>
        Our vendors may process data in the United States and other countries. Where required, we rely on appropriate
        safeguards for cross-border transfers.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, delete, or port your personal data, to
        object to or restrict certain processing, and to withdraw consent. To exercise these, contact{" "}
        <strong>[privacy@your-domain]</strong>. If you are in the EEA/UK, you may also complain to your local supervisory
        authority. California residents have rights under the CCPA/CPRA, including not to be discriminated against for
        exercising them; we do not sell or &ldquo;share&rdquo; personal information for cross-context behavioral advertising.
      </p>

      <h2>9. Cookies</h2>
      <p>
        We use strictly necessary cookies for authentication and security. We do not use non-essential advertising
        cookies. Any optional analytics would be described here and offered on an opt-in basis where required.
      </p>

      <h2>10. Children</h2>
      <p>The Service is for business use and is not directed to children under 16, and we do not knowingly collect their data.</p>

      <h2>11. Changes and contact</h2>
      <p>
        We may update this Policy; material changes will be posted here with a new date. Questions or requests:{" "}
        <strong>[privacy@your-domain]</strong>.
      </p>
    </main>
  );
}

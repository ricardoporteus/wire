import Link from "next/link";
import { PRODUCTS } from "./products";

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="foot-grid">
        <div>
          <span className="brand">Mavrix<span className="dot" style={{ color: "var(--lime)" }}>.</span></span>
          <p className="desc">The AI marketing team for founders: research, SEO and AEO, brand and writing, in one monthly sweep. Written against your brand, ready for every channel.</p>
        </div>
        <div>
          <h4>Products</h4>
          <ul>
            {PRODUCTS.map((p) => (
              <li key={p.id}><Link href={p.path}>{p.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Product</h4>
          <ul>
            <li><Link href="/how-it-works">How it works</Link></li>
            <li><Link href="/resources">Resources</Link></li>
            <li><Link href="/#pricing">Pricing</Link></li>
            <li><Link href="/dashboard">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><Link href="/legal/terms">Terms</Link></li>
            <li><Link href="/legal/privacy">Privacy</Link></li>
            <li><Link href="/legal/ai-disclosure">AI disclosure</Link></li>
          </ul>
        </div>
        <div className="foot-copy">© {new Date().getFullYear()} Mavrix. A performance marketing team, as software.</div>
      </div>
    </footer>
  );
}

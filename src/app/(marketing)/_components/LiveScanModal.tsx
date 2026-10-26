"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Avatar, type SpecialistId } from "./Avatars";
import type {
  DemoBrand, DemoBrief, DemoEvent, DemoKeyword, DemoPageOne,
} from "@/lib/demo-scan-types";

const STAGES: { key: string; label: string; ag: SpecialistId }[] = [
  { key: "scraping", label: "Reading your site", ag: "scout" },
  { key: "drafting", label: "Learning your brand", ag: "scout" },
  { key: "measuring", label: "Measuring demand", ag: "ada" },
  { key: "pageone", label: "Checking page one", ag: "ada" },
  { key: "audit", label: "Auditing your brand", ag: "iris" },
  { key: "guardrails", label: "Brand guardrails", ag: "iris" },
  { key: "writing", label: "Writing your plan", ag: "quill" },
];
const AG_GLOW: Record<SpecialistId, string> = {
  scout: "rgba(169,219,255,.7)", ada: "rgba(219,254,122,.7)", iris: "rgba(240,185,72,.7)", quill: "rgba(120,230,160,.7)",
};

// Blocks revealed one at a time, in order. Each maps to a rail stage for the glow.
const BLOCKS = ["site", "brand", "keywords", "pageone", "audit"] as const;
type BlockId = (typeof BLOCKS)[number];
const BLOCK_STAGE: Record<BlockId, string> = { site: "scraping", brand: "drafting", keywords: "measuring", pageone: "pageone", audit: "audit" };
const DWELL: Record<BlockId, number> = { site: 1600, brand: 2400, keywords: 3000, pageone: 2400, audit: 3000 };
const ROW_STAGGER = 340; // ms between each Ada keyword row revealing (text types in as it lands)

function setDemoCookie(token: string) {
  try {
    const dom = /(^|\.)mavrix\.agency$/i.test(location.hostname) ? "; domain=.mavrix.agency" : "";
    const sec = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `mavrix_demo_token=${encodeURIComponent(token)}; path=/; max-age=1800; samesite=lax${dom}${sec}`;
  } catch { /* cookies blocked — the query param still covers signed-in users */ }
}

export function LiveScanModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [fields, setFields] = useState<[string, string][]>([]);
  const [keywords, setKeywords] = useState<DemoKeyword[]>([]);
  const [pageOne, setPageOne] = useState<DemoPageOne[]>([]);
  const [brand, setBrand] = useState<DemoBrand | null>(null);
  const [briefs, setBriefs] = useState<DemoBrief[]>([]);
  const [siteRead, setSiteRead] = useState<{ pages: number; preview: string } | null>(null);
  const [counts, setCounts] = useState({ measured: 0, kept: 0, briefs: 0 });
  const [token, setToken] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Sequential reveal: which block's shell is visible, and which have filled.
  const [activeBlock, setActiveBlock] = useState<BlockId | null>(null);
  const [shown, setShown] = useState<BlockId[]>([]);
  const [filled, setFilled] = useState<BlockId[]>([]);

  const [gateOpen, setGateOpen] = useState(false);
  const [gatePassed, setGatePassed] = useState(false);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [continuing, setContinuing] = useState(false);

  const started = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const tokenRef = useRef<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Refs mirror the data so the sequential driver reads fresh values.
  const r = {
    site: useRef(false), fields: useRef(0), keywords: useRef(0), pageOne: useRef(0), brand: useRef(false),
    finished: useRef(false), error: useRef(false),
  };
  useEffect(() => { r.site.current = siteRead != null; }, [siteRead]);
  useEffect(() => { r.fields.current = fields.length; }, [fields]);
  useEffect(() => { r.keywords.current = keywords.length; }, [keywords]);
  useEffect(() => { r.pageOne.current = pageOne.length; }, [pageOne]);
  useEffect(() => { r.brand.current = brand != null; }, [brand]);
  useEffect(() => { r.finished.current = finished; }, [finished]);
  useEffect(() => { r.error.current = error != null; }, [error]);

  const scrollDown = () => { const el = feedRef.current; if (el) el.scrollTop = el.scrollHeight; };
  useEffect(() => { scrollDown(); }, [shown, filled, gatePassed, briefs]);

  function ready(id: BlockId): boolean {
    switch (id) {
      case "site": return r.site.current;
      case "brand": return r.fields.current > 0;
      case "keywords": return r.keywords.current > 0;
      case "pageone": return r.pageOne.current > 0;
      case "audit": return r.brand.current;
    }
  }

  // The sequential driver: reveal a block, wait for its data, fill it, dwell, next.
  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    (async () => {
      for (const id of BLOCKS) {
        if (cancelled || r.error.current) return;
        setActiveBlock(id);
        setShown((s) => (s.includes(id) ? s : [...s, id]));
        const t0 = Date.now();
        // wait for this block's data (or give up if the scan ends without it)
        while (!cancelled && !ready(id)) {
          if (r.error.current) return;
          if (r.finished.current) break;
          if (Date.now() - t0 > 30000) break;
          await sleep(140);
        }
        if (cancelled || r.error.current) return;
        if (!ready(id)) { setShown((s) => s.filter((x) => x !== id)); continue; } // no data → skip (e.g. page one)
        const workedFor = Date.now() - t0;
        if (workedFor < 900) await sleep(900 - workedFor); // let the "working" state read
        if (cancelled) return;
        setFilled((f) => (f.includes(id) ? f : [...f, id]));
        // keywords reveal row-by-row — hold until the cascade finishes, then dwell
        const dwell = id === "keywords" ? Math.min(r.keywords.current, 16) * ROW_STAGGER + 1200 : DWELL[id];
        await sleep(dwell);
      }
      if (cancelled || r.error.current) return;
      setActiveBlock(null);
      await sleep(500);
      scrollDown();
      if (!cancelled) setGateOpen(true);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // timer
  useEffect(() => {
    if (finished || error) return;
    const t = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(t);
  }, [finished, error]);

  // run the scan once
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const ac = new AbortController();
    abortRef.current = ac;

    (async () => {
      try {
        const res = await fetch("/api/demo-scan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url }),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => null);
          setError(j?.error ?? "The scan couldn't start. Please try again.");
          setFinished(true);
          return;
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (line) handle(JSON.parse(line) as DemoEvent);
          }
        }
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        setError("The scan was interrupted. Please try again.");
        setFinished(true);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handle(ev: DemoEvent) {
    switch (ev.t) {
      case "token": setToken(ev.token); tokenRef.current = ev.token; break;
      case "siteRead": setSiteRead({ pages: ev.pages, preview: ev.preview }); break;
      case "brandField": { const label = ev.label, value = ev.value; setFields((f) => (f.some(([l]) => l === label) ? f : [...f, [label, value]])); break; }
      case "keyword": setKeywords((k) => [...k, ev.row]); break;
      case "pageone": setPageOne((p) => [...p, ev.card]); break;
      case "audit": setBrand(ev.brand); break;
      case "brief": setBriefs((b) => [...b, ev.brief]); break;
      case "counts": setCounts({ measured: ev.measured, kept: ev.kept, briefs: ev.briefs }); break;
      case "done": setToken(ev.token); tokenRef.current = ev.token; setFinished(true); break;
      case "error": setError(ev.message); setFinished(true); break;
    }
  }

  async function submitEmail(e: FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!/.+@.+\..+/.test(v)) { setEmailErr("Enter a valid email to save your plan."); return; }
    setEmailErr(null);
    setSavingEmail(true);
    const tk = tokenRef.current;
    if (tk) {
      await fetch("/api/demo-scan/lead", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: tk, email: v }),
      }).catch(() => {});
    }
    setSavingEmail(false);
    setGatePassed(true);
    setGateOpen(false);
  }

  function goToDashboard() {
    const tk = tokenRef.current;
    setContinuing(true);
    if (tk) setDemoCookie(tk);
    window.location.href = tk ? `/onboarding?demo=${encodeURIComponent(tk)}` : "/dashboard";
  }

  // Rail progress follows the active block (or everything done once gated).
  const doneCount = (gateOpen || gatePassed) ? STAGES.length : (activeBlock ? STAGES.findIndex((s) => s.key === BLOCK_STAGE[activeBlock]) : 0);
  const activeAg = activeBlock ? STAGES.find((s) => s.key === BLOCK_STAGE[activeBlock])?.ag ?? null : null;
  const showPlan = gatePassed;
  const showPromo = gatePassed && finished && !error;

  return (
    <div className="ls-scrim" role="dialog" aria-modal="true" aria-label="Live scan">
      <div className="ls-modal">
        <div className="ls-bar">
          <span className="dot" />
          <span className="ls-ttl">Mavrix Live Scan <span>· {safeHost(url)}</span></span>
          <span className="ls-tmr">{elapsed.toFixed(1)}s</span>
          <button className="ls-close" type="button" aria-label="Close" onClick={() => { abortRef.current?.abort(); onClose(); }}>✕</button>
        </div>

        <div className="ls-body">
          <aside className="ls-rail">
            <div className="ls-agents">
              {(["scout", "ada", "iris", "quill"] as SpecialistId[]).map((id) => (
                <div key={id} className={`ls-ag${activeAg === id ? " on" : ""}`} style={{ "--glow": AG_GLOW[id] } as CSSProperties}>
                  <Avatar id={id} />
                </div>
              ))}
            </div>
            <div className="ls-stages">
              {STAGES.map((s, i) => {
                const state = i < doneCount ? "done" : (activeBlock && s.key === BLOCK_STAGE[activeBlock]) ? "active" : "";
                return (
                  <div key={s.key} className={`ls-stg ${state}`}>
                    <span className="ic">{i < doneCount ? "✓" : i + 1}</span>{s.label}
                  </div>
                );
              })}
            </div>
            <div className="ls-counts">
              <div className="ls-cnt"><b>{counts.measured.toLocaleString()}</b><span>searches measured</span></div>
              <div className="ls-cnt"><b>{counts.kept}</b><span>kept for your buyer</span></div>
              <div className="ls-cnt"><b>{counts.briefs}</b><span>briefs queued</span></div>
            </div>
          </aside>

          <div className="ls-feed" ref={feedRef}>
            {shown.length === 0 && !error && (
              <div className="ls-panel in"><div className="ls-card"><Working label="Starting your scan" /></div></div>
            )}
            {error && (
              <div className="ls-err">
                <div>{error}</div>
                <div className="ls-err-cta">
                  <a className="ls-btn" href="/dashboard">Log in to try →</a>
                  <button type="button" className="ls-ghost" onClick={() => { abortRef.current?.abort(); onClose(); }}>Try another site</button>
                </div>
              </div>
            )}

            {shown.includes("site") && !error && (
              <div className="ls-panel in">
                <div className="ls-phead"><b>Scout</b> · reading {safeHost(url)}</div>
                <div className="ls-card">
                  {filled.includes("site") && siteRead ? (
                    <div className="ls-bbrain">
                      <div className="ls-fld"><div className="l">Pages read</div><div className="v">{siteRead.pages} page{siteRead.pages === 1 ? "" : "s"} scanned</div></div>
                      {siteRead.preview && <div className="ls-fld"><div className="l">On the page</div><div className="v"><Typewriter text={siteRead.preview + "…"} cps={120} /></div></div>}
                    </div>
                  ) : <Working label="Fetching your homepage" />}
                </div>
              </div>
            )}

            {shown.includes("brand") && !error && (
              <div className="ls-panel in">
                <div className="ls-phead"><b>Scout</b> · learning your brand</div>
                <div className="ls-card">
                  {filled.includes("brand") && fields.length > 0 ? (
                    <div className="ls-bbrain">
                      {fields.map(([l, v]) => (
                        <div key={l} className="ls-fld"><div className="l">{l}</div><div className="v"><Typewriter text={v} /></div></div>
                      ))}
                    </div>
                  ) : <Working label="Reading your pages and learning your voice" />}
                </div>
              </div>
            )}

            {shown.includes("keywords") && !error && (
              <div className="ls-panel in">
                <div className="ls-phead"><b>Ada</b> · measuring real demand</div>
                <div className="ls-card">
                  {filled.includes("keywords") && keywords.length > 0 ? (
                    <KeywordRows rows={keywords} stagger={ROW_STAGGER} />
                  ) : <Working label="Measuring real search demand" />}
                </div>
              </div>
            )}

            {shown.includes("pageone") && !error && (
              <div className="ls-panel in">
                <div className="ls-phead"><b>Ada</b> · what Google&rsquo;s page one rewards</div>
                <div className="ls-card">
                  {filled.includes("pageone") && pageOne.length > 0 ? (
                    <div className="ls-p1grid">
                      {pageOne.map((c) => (
                        <div key={c.phrase} className="ls-poc">
                          <div className="q">&ldquo;{c.phrase}&rdquo;</div>
                          <div className="row2">
                            <span className={`ls-tag ${c.aiOverview ? "yes" : "no"}`}>{c.aiOverview ? "✓" : "·"} AI Overview</span>
                            <span className={`ls-tag ${c.peopleAlsoAsk.length ? "yes" : "no"}`}>{c.peopleAlsoAsk.length ? "✓" : "·"} People Also Ask</span>
                            <span className={`ls-tag ${c.featuredSnippet ? "yes" : "no"}`}>{c.featuredSnippet ? "✓" : "·"} snippet</span>
                          </div>
                          <div className="rec">→ {c.recommendedFormat}</div>
                        </div>
                      ))}
                    </div>
                  ) : <Working label="Checking Google's page one" />}
                </div>
              </div>
            )}

            {shown.includes("audit") && !error && (
              <div className="ls-panel in">
                <div className="ls-card ls-audit">
                  {filled.includes("audit") && brand ? (
                    <>
                      <div className="ah">Here&rsquo;s what Mavrix now knows about {brand.name}.</div>
                      <div className="asub">A full brand audit — the same detail that lives in your Settings. This is why every piece sounds like you and targets your real buyer.</div>
                      <div className="ls-acols">
                        {brand.voicePillars.length > 0 && (
                          <div className="ls-ab"><h4>Voice &amp; principles</h4><ul>
                            {brand.voicePillars.map((p) => <li key={p.name}><b>{p.name}</b> — {p.description}</li>)}
                            {brand.principles.slice(0, 2).map((p) => <li key={p}>✓ {p}</li>)}
                          </ul></div>
                        )}
                        {(brand.sayWords.length > 0 || brand.banWords.length > 0) && (
                          <div className="ls-ab"><h4>Vocabulary</h4><ul>
                            {brand.sayWords.length > 0 && <li><span className="ls-chips">{brand.sayWords.map((w) => <span key={w} className="ls-chip lime">{w}</span>)}</span></li>}
                            {brand.banWords.length > 0 && <li><span className="ls-chips">{brand.banWords.map((w) => <span key={w} className="ls-chip ban">{w}</span>)}</span></li>}
                          </ul></div>
                        )}
                        {brand.icpWho && <div className="ls-ab"><h4>Ideal customer</h4><ul><li>{brand.icpWho}</li></ul></div>}
                        {brand.competitors.length > 0 && (
                          <div className="ls-ab"><h4>Competitors</h4><ul>
                            {brand.competitors.map((c, i) => <li key={i}><b>{c.name ?? c.url}</b>{c.note ? ` — ${c.note}` : ""}</li>)}
                          </ul></div>
                        )}
                        {(brand.values.length > 0 || brand.facts.length > 0) && (
                          <div className="ls-ab"><h4>Values &amp; approved facts</h4><ul>
                            {brand.values.length > 0 && <li><b>{brand.values.map((v) => v.name).join(" · ")}</b></li>}
                            {brand.facts.map((f, i) => <li key={i}><b>Fact:</b> {f.fact}</li>)}
                          </ul></div>
                        )}
                        {brand.guardrails.length > 0 && (
                          <div className="ls-ab"><h4>Guardrails</h4><ul>
                            {brand.guardrails.map((g) => <li key={g}>✓ {g}</li>)}
                          </ul></div>
                        )}
                      </div>
                    </>
                  ) : <Working label="Compiling your brand audit" />}
                </div>
              </div>
            )}

            {showPlan && briefs.length > 0 && (
              <div className="ls-panel in">
                <div className="ls-phead"><b>Quill</b> · your 30-day plan</div>
                <div className="ls-card">
                  {briefs.map((b) => (
                    <div key={b.phrase} className="ls-brief">
                      <span className="ck">✓</span>
                      <div><div className="bt">{b.title}</div><div className="bm">{b.phrase} · <span className={`ls-pz p${b.priority}`}>P{b.priority}</span></div></div>
                      <div className="vol"><div className="n">{b.volume != null ? b.volume.toLocaleString() : "—"}</div><div className="s">searches/mo</div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showPromo && (
              <div className="ls-panel in">
                <div className="ls-done">
                  <div className="big">Your 30-day plan is ready.</div>
                  <div className="sub">{counts.measured.toLocaleString()} searches measured · {counts.kept} kept · {counts.briefs} briefs — audited and on-brand.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* email gate — opens only after every block has filled and the feed scrolled to the end */}
        {gateOpen && !gatePassed && (
          <div className="ls-overlay">
            <div className="ls-gatec">
              <span className="eg">✦</span>
              <h3>Your Content Strategy and examples are ready to review&hellip;</h3>
              <p>We&rsquo;ve measured your market, checked Google&rsquo;s page one and audited your brand. Content and growth strategy is ready to deploy&hellip;</p>
              <form onSubmit={submitEmail}>
                <input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
                <div className="ferr">{emailErr}</div>
                <button className="ls-btn full" type="submit" disabled={savingEmail}>{savingEmail ? "Saving…" : "Unlock my plan →"}</button>
              </form>
              <p className="fine">NO CREDIT CARD NEEDED. You can review all for free</p>
            </div>
          </div>
        )}

        {/* hard-promo close */}
        {showPromo && (
          <div className="ls-overlay">
            <div className="ls-promoc">
              <span className="seal">✓</span>
              <h2>Your content engine is ready. <span className="hl">Now let it run.</span></h2>
              <div className="ls-promise">
                <div className="ls-pr"><span className="t">01</span><span><b>Qualified traffic you can convert — in your first week.</b> Your highest-intent briefs ship first, aimed at buyers already searching.</span></div>
                <div className="ls-pr"><span className="t">02</span><span><b>Traffic growth and higher rankings — within 90 days.</b> A compounding library, measured and refreshed every sweep.</span></div>
              </div>
              <button className="ls-btn big" type="button" onClick={goToDashboard} disabled={continuing}>{continuing ? "Opening your dashboard…" : "Continue to your dashboard →"}</button>
              <p className="guar">Founder guarantee: if your first sweep doesn&rsquo;t hand you 10+ briefs worth writing, you don&rsquo;t pay. Ever.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** A pulsing "working" line shown in a block before its data arrives. */
function Working({ label }: { label: string }) {
  return <div className="ls-working"><span className="d" /> {label}…</div>;
}

/** Ada's keyword table — rows cascade in one at a time, each phrase typing as it lands. */
function KeywordRows({ rows, stagger = 340 }: { rows: DemoKeyword[]; stagger?: number }) {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [n, setN] = useState(reduce ? rows.length : 1);
  useEffect(() => {
    if (reduce || n >= rows.length) return;
    const id = window.setTimeout(() => setN((x) => Math.min(x + 1, rows.length)), stagger);
    return () => clearTimeout(id);
  }, [n, rows.length, stagger, reduce]);
  return (
    <table className="ls-tbl">
      <thead><tr><th>Keyword</th><th>Volume</th><th>KD</th><th>Priority</th></tr></thead>
      <tbody>
        {rows.slice(0, n).map((k) => (
          <tr key={k.phrase} className="in">
            {/* same key across re-renders → only the newly revealed row mounts and types */}
            <td className="kw"><Typewriter text={k.phrase} cps={90} /></td>
            <td>{k.volume != null ? `${k.volume.toLocaleString()}/mo` : "—"}</td>
            <td><span className="ls-kd"><span className="ls-trk"><i style={{ width: `${k.kd ?? 0}%`, background: kdColor(k.kd) }} /></span>{k.kd ?? "—"}</span></td>
            <td><span className={`ls-pz p${k.priority}`}>P{k.priority}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Types `text` in once on mount (skips to full text under reduced motion). */
function Typewriter({ text, cps = 55 }: { text: string; cps?: number }) {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [n, setN] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce || n >= text.length) return;
    const id = window.setInterval(() => {
      setN((x) => { if (x >= text.length) { clearInterval(id); return x; } return x + 1; });
    }, 1000 / cps);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>{text.slice(0, n)}{n < text.length && <span className="ls-caret" />}</>;
}

function kdColor(kd: number | null): string {
  if (kd == null) return "rgba(255,255,255,.3)";
  return kd < 30 ? "#60D184" : kd < 60 ? "#F0B948" : "#ff7a7a";
}

function safeHost(url: string): string {
  try { return new URL(/^https?:/.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch { return url; }
}

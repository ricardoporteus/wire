/**
 * Minimal DataForSEO v3 client — only the endpoints the keyword pipeline needs.
 *
 * Every call is a "live" task (answer in one round trip, no polling). Each
 * response carries its own `cost` in USD, which we sum so callers can report
 * true COGS per run instead of estimating it.
 *
 * Auth is HTTP Basic with the API login/password from the DataForSEO dashboard
 * (not the account's web password): DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD.
 */

const BASE = "https://api.dataforseo.com/v3";

export type Locale = { location_name: string; language_code: string };

/** One keyword with the metrics we care about, normalized across endpoints. */
export type KeywordMetrics = {
  keyword: string;
  searchVolume: number | null;  // monthly, Google, for the locale
  kd: number | null;            // DataForSEO keyword difficulty, 0–100
  cpc: number | null;           // USD
  intent: string | null;        // informational | navigational | commercial | transactional
  trend: number[];              // last 12 months of volume, oldest first
};

export type SerpFeatures = {
  keyword: string;
  featuredSnippet: boolean;
  aiOverview: boolean;
  peopleAlsoAsk: string[];
  topDomains: string[];
  topTitles: string[];   // organic titles: the model reads these to pick the format Google rewards
  itemTypes: string[];   // every SERP feature present (local_pack, video, ...)
};

export class DataForSEO {
  /** Running USD total of every call made through this client. */
  costUsd = 0;
  private auth: string;

  constructor(login = cleanEnv(process.env.DATAFORSEO_LOGIN), password = cleanEnv(process.env.DATAFORSEO_PASSWORD)) {
    if (!login || !password) throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be set");
    this.auth = "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
  }

  /**
   * One task, retried on transient failures: 40202 rate limit, 5xxxx server
   * errors, and 40104 "verify your account", which DataForSEO returns
   * intermittently on Labs endpoints for a while after an account is verified.
   */
  private async post<R>(path: string, task: Record<string, unknown>, method: "POST" | "GET" = "POST"): Promise<R | null> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.once<R>(path, task, method);
      } catch (e) {
        const code = (e as { code?: number }).code ?? 0;
        const transient = code === 40104 || code === 40202 || code >= 50000;
        if (!transient || attempt >= 4) throw e;
        await new Promise((r) => setTimeout(r, 3000 * 2 ** attempt)); // 3s, 6s, 12s, 24s
      }
    }
  }

  /** POST one task and return its first result object. Throws on any non-20000 status. */
  private async once<R>(path: string, task: Record<string, unknown>, method: "POST" | "GET" = "POST"): Promise<R | null> {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: this.auth, "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify([task]) : undefined,
    });
    // Errors (401 bad login, 403 unverified account, 402 no funds) still carry a
    // JSON body whose status_message says what to fix — surface it, not just the code.
    const body = (await res.json().catch(() => ({ status_code: res.status, status_message: `HTTP ${res.status}` }))) as {
      status_code: number; status_message: string; cost?: number;
      tasks?: { status_code: number; status_message: string; result?: R[] | null }[];
    };
    this.costUsd += body.cost ?? 0;
    if (body.status_code !== 20000) throw dfsError(path, body.status_code, body.status_message);
    const t = body.tasks?.[0];
    if (!t || t.status_code !== 20000) throw dfsError(path, t?.status_code ?? 0, t?.status_message ?? "no task");
    return t.result?.[0] ?? null;
  }

  /**
   * Fail fast before a run spends anything elsewhere: checks the login, that the
   * account is verified (DataForSEO blocks data calls until it is, while account
   * endpoints still work), and returns the balance. Costs one keyword lookup.
   */
  async preflight(locale: Locale): Promise<{ balanceUsd: number | null }> {
    const user = await this.post<{ money?: { balance?: number } }>("/appendix/user_data", {}, "GET");
    await this.keywordOverview(["seo"], locale);
    return { balanceUsd: user?.money?.balance ?? null };
  }

  /** Exact metrics for up to 700 known phrases. Phrases DataForSEO has no data for are simply absent. */
  async keywordOverview(keywords: string[], locale: Locale): Promise<KeywordMetrics[]> {
    const r = await this.post<{ items?: LabsKeywordItem[] | null }>(
      "/dataforseo_labs/google/keyword_overview/live",
      { keywords: keywords.slice(0, 700), ...locale },
    );
    return (r?.items ?? []).map(toMetrics);
  }

  /** Expand up to 200 seed phrases into related keywords that have measured volume. */
  async keywordIdeas(seeds: string[], locale: Locale, limit = 300): Promise<KeywordMetrics[]> {
    const r = await this.post<{ items?: LabsKeywordItem[] | null }>(
      "/dataforseo_labs/google/keyword_ideas/live",
      {
        keywords: seeds.slice(0, 200), ...locale, limit,
        // No order_by: DataForSEO's default is relevance to the seeds, which is
        // what we want. Sorting by volume floods the pool with generic head terms.
        filters: [["keyword_info.search_volume", ">", 0]],
      },
    );
    return (r?.items ?? []).map(toMetrics);
  }

  /** Keywords a domain actually ranks for, highest estimated traffic first. */
  async rankedKeywords(domain: string, locale: Locale, limit = 100): Promise<(KeywordMetrics & { rank: number | null; url: string | null })[]> {
    const r = await this.post<{ items?: { keyword_data: LabsKeywordItem; ranked_serp_element?: { serp_item?: { rank_group?: number; url?: string } } }[] | null }>(
      "/dataforseo_labs/google/ranked_keywords/live",
      { target: domain, ...locale, limit, order_by: ["ranked_serp_element.serp_item.etv,desc"] },
    );
    return (r?.items ?? []).map((i) => ({
      ...toMetrics(i.keyword_data),
      rank: i.ranked_serp_element?.serp_item?.rank_group ?? null,
      url: i.ranked_serp_element?.serp_item?.url ?? null,
    }));
  }

  /** Keywords `competitor` ranks for that `site` does not — the real content gap. */
  async gapKeywords(competitor: string, site: string, locale: Locale, limit = 100): Promise<KeywordMetrics[]> {
    const r = await this.post<{ items?: { keyword_data: LabsKeywordItem }[] | null }>(
      "/dataforseo_labs/google/domain_intersection/live",
      {
        target1: competitor, target2: site, intersections: false, ...locale, limit,
        order_by: ["keyword_data.keyword_info.search_volume,desc"],
      },
    );
    return (r?.items ?? []).map((i) => toMetrics(i.keyword_data));
  }

  /** Live Google results page: which answer features exist and who ranks. ~$0.002 each. */
  async serp(keyword: string, locale: Locale): Promise<SerpFeatures> {
    const r = await this.post<{ items?: SerpItem[] | null }>(
      "/serp/google/organic/live/advanced",
      { keyword, ...locale, depth: 10 },
    );
    const items = r?.items ?? [];
    return {
      keyword,
      featuredSnippet: items.some((i) => i.type === "featured_snippet"),
      aiOverview: items.some((i) => i.type === "ai_overview"),
      peopleAlsoAsk: items
        .filter((i) => i.type === "people_also_ask")
        .flatMap((i) => (i.items ?? []).map((q) => q.title).filter((t): t is string => !!t)),
      topDomains: items.filter((i) => i.type === "organic").map((i) => i.domain).filter((d): d is string => !!d).slice(0, 5),
      topTitles: items.filter((i) => i.type === "organic").map((i) => i.title).filter((t): t is string => !!t).slice(0, 10),
      itemTypes: [...new Set(items.map((i) => i.type))],
    };
  }

  /**
   * Google Trends discovery: rising and top related queries for one term over
   * the past 12 months. Rising queries are what's emerging now — new seeds the
   * brand's own vocabulary would never produce.
   */
  async trendsExplore(keyword: string, locale: Locale): Promise<{ rising: string[]; top: string[] }> {
    const r = await this.post<{ items?: { type: string; data?: { top?: { query: string }[] | null; rising?: { query: string }[] | null } | null }[] | null }>(
      "/keywords_data/google_trends/explore/live",
      { keywords: [keyword], location_name: locale.location_name, time_range: "past_12_months", item_types: ["google_trends_queries_list"] },
    );
    const lists = (r?.items ?? []).filter((i) => i.type === "google_trends_queries_list");
    return {
      rising: lists.flatMap((l) => (l.data?.rising ?? []).map((q) => q.query.toLowerCase())),
      top: lists.flatMap((l) => (l.data?.top ?? []).map((q) => q.query.toLowerCase())),
    };
  }

  /** Dedicated intent classifier (up to 1,000 phrases, works across languages). */
  async searchIntent(keywords: string[], languageCode: string): Promise<Map<string, { intent: string; probability: number | null }>> {
    const r = await this.post<{ items?: { keyword: string; keyword_intent?: { label: string; probability?: number | null } | null }[] | null }>(
      "/dataforseo_labs/google/search_intent/live",
      { keywords: keywords.slice(0, 1000), language_code: languageCode },
    );
    return new Map((r?.items ?? []).filter((i) => i.keyword_intent)
      .map((i) => [i.keyword.toLowerCase(), { intent: i.keyword_intent!.label, probability: i.keyword_intent!.probability ?? null }]));
  }

  /** How often each phrase is asked in AI assistants (ChatGPT etc.), monthly. */
  async aiSearchVolume(keywords: string[], locale: Locale): Promise<Map<string, number | null>> {
    const r = await this.post<{ items?: { keyword: string; ai_search_volume?: number | null }[] | null }>(
      "/ai_optimization/ai_keyword_data/keywords_search_volume/live",
      { keywords: keywords.slice(0, 1000), ...locale },
    );
    return new Map((r?.items ?? []).map((i) => [i.keyword.toLowerCase(), i.ai_search_volume ?? null]));
  }
}

/**
 * Env values pasted into a dashboard can carry a trailing newline, spaces or
 * the quotes from a .env line; any of them makes DataForSEO reject the login
 * (40100). Strip them rather than fail the first production run on it.
 */
function cleanEnv(v: string | undefined): string | undefined {
  return v?.trim().replace(/^(["'])(.*)\1$/, "$2").trim() || undefined;
}

function dfsError(path: string, code: number, message: string) {
  return Object.assign(new Error(`DataForSEO ${path}: ${message}`), { code });
}

/* ---------------------------- response shapes ---------------------------- */

type LabsKeywordItem = {
  keyword: string;
  keyword_info?: { search_volume?: number | null; cpc?: number | null; monthly_searches?: { year: number; month: number; search_volume: number | null }[] | null };
  keyword_properties?: { keyword_difficulty?: number | null };
  search_intent_info?: { main_intent?: string | null };
};

type SerpItem = { type: string; domain?: string; title?: string; items?: { title?: string }[] | null };


function toMetrics(i: LabsKeywordItem): KeywordMetrics {
  const monthly = [...(i.keyword_info?.monthly_searches ?? [])]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .slice(-12)
    .map((m) => m.search_volume ?? 0);
  return {
    keyword: i.keyword.toLowerCase(),
    searchVolume: i.keyword_info?.search_volume ?? null,
    kd: i.keyword_properties?.keyword_difficulty ?? null,
    cpc: i.keyword_info?.cpc ?? null,
    intent: i.search_intent_info?.main_intent ?? null,
    trend: monthly,
  };
}

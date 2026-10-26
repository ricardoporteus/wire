import type { Author, Category, CategorySlug, ContentType } from "./types";
import type { SpecialistId } from "@/app/(marketing)/_components/Avatars";

/** The three pillars. Order here is the order they appear on the hub rail. */
export const CATEGORIES: Category[] = [
  {
    slug: "ai-search",
    name: "AI Search & AEO",
    tagline: "Get quoted by AI",
    description:
      "Answer Engine Optimization for ChatGPT, Google AI Overviews and Perplexity. How AI engines choose what to cite, and how to be the answer.",
    accent: "sky",
  },
  {
    slug: "seo",
    name: "SEO Playbooks",
    tagline: "Get found on Google",
    description:
      "Keyword strategy, topic clusters, on-page and technical SEO, and how to measure what actually moves rankings. Playbooks for lean teams.",
    accent: "lime",
  },
  {
    slug: "content-gtm",
    name: "Content & GTM",
    tagline: "Convert customers",
    description:
      "Go-to-market content systems, repurposing, brand voice and the compounding content engine that turns traffic into pipeline.",
    accent: "mint",
  },
];

export const CATEGORY_BY_SLUG: Record<CategorySlug, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, Category>;

/** Human labels for the content-type badges. */
export const TYPE_LABEL: Record<ContentType, string> = {
  "deep-dive": "Deep dive",
  "how-to": "How-to guide",
  tutorial: "Tutorial",
  comparison: "Comparison",
  listicle: "Listicle",
};

/** The AI team doubles as the masthead — each pillar has a natural byline. */
export const AUTHORS: Record<SpecialistId, Author> = {
  scout: { id: "scout", name: "Scout", role: "Research Analyst", bio: "Measures what buyers actually search before a word gets written." },
  ada: { id: "ada", name: "Ada", role: "SEO & AEO Strategist", bio: "Backs every keyword with real volume and shapes each piece to win Google and AI answers." },
  iris: { id: "iris", name: "Iris", role: "Brand Guardian", bio: "Holds every draft to your voice, positioning and approved facts." },
  quill: { id: "quill", name: "Quill", role: "Senior Copywriter", bio: "Writes long-form that ranks, then reshapes it for every channel." },
};

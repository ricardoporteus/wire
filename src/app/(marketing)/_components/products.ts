import type { SpecialistId } from "./Avatars";

/** Canonical product list, used by the nav dropdown, mobile menu and cross-sell. */
export type Product = {
  id: "research" | "seo" | "brand" | "writer";
  path: string;
  name: string;
  persona: string; // professional name
  role: string; // short descriptor for menus
  avatar: SpecialistId;
};

export const PRODUCTS: Product[] = [
  { id: "research", path: "/products/research", name: "Research", persona: "Scout", role: "Market research", avatar: "scout" },
  { id: "seo", path: "/products/seo", name: "SEO & AEO", persona: "Ada", role: "Search & AI answers", avatar: "ada" },
  { id: "brand", path: "/products/brand", name: "Brand", persona: "Iris", role: "Voice & guardrails", avatar: "iris" },
  { id: "writer", path: "/products/writer", name: "Writer", persona: "Quill", role: "Drafting & repurposing", avatar: "quill" },
];

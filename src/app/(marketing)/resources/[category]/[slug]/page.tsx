import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "../../../_components/SiteNav";
import { SiteFooter } from "../../../_components/SiteFooter";
import { ArticleView } from "../../../_components/resources/ArticleView";
import { getAllArticles, getArticle, getRelated } from "@/content/resources";
import { CATEGORY_BY_SLUG } from "@/content/resources/meta";
import type { CategorySlug } from "@/content/resources/types";

const CATS = new Set<CategorySlug>(["ai-search", "seo", "content-gtm"]);
const isCategory = (s: string): s is CategorySlug => CATS.has(s as CategorySlug);

// Re-render hourly, and allow a scheduled slug (not prerendered at build because
// it was still future-dated) to render on demand once its publishAt passes.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const all = await getAllArticles(); // live only — future/draft slugs render on demand later
  return all.map((a) => ({ category: a.category, slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  if (!isCategory(category)) return {};
  const article = await getArticle(category, slug);
  if (!article) return {};
  const url = `/resources/${category}/${slug}`;
  return {
    title: `${article.title} — Mavrix`,
    description: article.excerpt,
    keywords: article.tags,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url,
      type: "article",
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified,
      section: CATEGORY_BY_SLUG[category].name,
      tags: article.tags,
    },
    twitter: { card: "summary_large_image", title: article.title, description: article.excerpt },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  if (!isCategory(category)) notFound();
  const article = await getArticle(category, slug);
  if (!article) notFound();
  const related = await getRelated(article);

  return (
    <>
      <SiteNav />
      <ArticleView article={article} related={related} />
      <SiteFooter />
    </>
  );
}

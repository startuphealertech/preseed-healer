import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getCategories, getPages, getPostSitemap } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

const staticRoutes: { path: string; priority: number; changeFrequency: Freq }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/apply", priority: 0.9, changeFrequency: "monthly" },
  { path: "/startups", priority: 0.9, changeFrequency: "monthly" },
  { path: "/investors", priority: 0.9, changeFrequency: "weekly" },
  { path: "/investors/join", priority: 0.7, changeFrequency: "yearly" },
  { path: siteConfig.event.href, priority: 0.8, changeFrequency: "weekly" },
  { path: "/phase-01", priority: 0.8, changeFrequency: "weekly" },
  { path: "/phase-02", priority: 0.6, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/partners", priority: 0.7, changeFrequency: "weekly" },
  { path: "/insights", priority: 0.8, changeFrequency: "daily" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, pages] = await Promise.all([
    getPostSitemap().catch(() => []),
    getCategories().catch(() => []),
    getPages().catch(() => []),
  ]);

  return [
    ...staticRoutes.map((r) => ({ url: absoluteUrl(r.path), changeFrequency: r.changeFrequency, priority: r.priority })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/insights/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...categories
      .filter((c) => (c.postCount ?? 0) > 0)
      .map((c) => ({ url: absoluteUrl(`/insights/category/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...pages.map((p) => ({
      url: absoluteUrl(`/legal/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}

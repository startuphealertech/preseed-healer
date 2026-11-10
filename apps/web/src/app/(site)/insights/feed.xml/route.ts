import { siteConfig } from "@/config/site";
import { getPosts } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** RSS 2.0 feed of the latest 30 articles. */
export async function GET() {
  const { items } = await getPosts({ page: 1, limit: 30 });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(`${siteConfig.name} Insights`)}</title>
<link>${absoluteUrl("/insights")}</link>
<description>${esc("Startup fundraising guides and programme updates from PreSeedHealer.")}</description>
<language>en-in</language>
<atom:link href="${absoluteUrl("/insights/feed.xml")}" rel="self" type="application/rss+xml"/>
${items
  .map(
    (p) => `<item>
<title>${esc(p.title)}</title>
<link>${absoluteUrl(`/insights/${p.slug}`)}</link>
<guid isPermaLink="true">${absoluteUrl(`/insights/${p.slug}`)}</guid>
${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ""}
${p.category ? `<category>${esc(p.category.name)}</category>` : ""}
<description>${esc(p.excerpt)}</description>
</item>`,
  )
  .join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
